const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/roles');

router.use(authenticate);
const requireFreelancer = requireRole('freelancer');

/**
 * GET /api/recommendations/projects
 * Returns recommended projects for the authenticated freelancer
 * Factors:
 * 1. Skill matching
 * 2. Project success history
 * 3. Budget range preferences
 * 4. Expected work hours preferences
 */
router.get('/projects', requireFreelancer, async (req, res) => {
    const freelancerId = req.user.id;

    try {
        // Step 1: Get the freelancer's skills
        const userSkillsResult = await pool.query(
            `SELECT skill_id 
             FROM user_skills 
             WHERE user_id = $1`,
            [freelancerId]
        );

        const userSkills = userSkillsResult.rows.map(row => row.skill_id);

        // Step 2: Get the freelancer's preferences
        const preferencesResult = await pool.query(
            `SELECT min_budget, max_budget, expected_work_hours
             FROM freelancer_preferences
             WHERE user_id = $1`,
            [freelancerId]
        );

        // Default preferences if none set
        let minBudget = 0;
        let maxBudget = Number.MAX_SAFE_INTEGER;
        let expectedWorkHours = null;

        if (preferencesResult.rows.length > 0) {
            const prefs = preferencesResult.rows[0];
            minBudget = prefs.min_budget || minBudget;
            maxBudget = prefs.max_budget || maxBudget;
            expectedWorkHours = prefs.expected_work_hours;
        }

        // Step 3: Get the freelancer's successful project history
        const historyResult = await pool.query(
            `SELECT p.id, p.categories, ps.skill_id, p.expected_work_hours
             FROM projects p
             JOIN project_applications_history pah ON p.id = pah.project_id
             JOIN project_skills ps ON p.id = ps.project_id
             WHERE pah.user_id = $1 AND pah.success_score >= 7
             ORDER BY pah.success_score DESC`,
            [freelancerId]
        );

        // Extract successful project categories and skills
        const successfulProjectSkills = new Set();
        const successfulCategories = new Set();
        let avgSuccessfulWorkHours = null;
        let successfulProjectCount = 0;

        historyResult.rows.forEach(row => {
            if (row.skill_id) successfulProjectSkills.add(row.skill_id);
            if (row.categories) {
                const cats = Array.isArray(row.categories) ? row.categories : [];
                cats.forEach(cat => successfulCategories.add(cat));
            }
            if (row.expected_work_hours) {
                if (avgSuccessfulWorkHours === null) {
                    avgSuccessfulWorkHours = row.expected_work_hours;
                    successfulProjectCount = 1;
                } else {
                    avgSuccessfulWorkHours = (avgSuccessfulWorkHours * successfulProjectCount + row.expected_work_hours) / (successfulProjectCount + 1);
                    successfulProjectCount++;
                }
            }
        });

        // Use either the preferred work hours or the average from successful projects
        const preferredWorkHours = expectedWorkHours || avgSuccessfulWorkHours;
        
        // Convert categories to an array for the query
        const categoriesArray = Array.from(successfulCategories);

        const recommendationsQuery = `
            WITH project_skill_matches AS (
                SELECT 
                    p.id,
                    p.title,
                    p.description,
                    p.budget,
                    p.deadline,
                    p.expected_work_hours,
                    p.client_id,
                    p.status,
                    u.name AS client_name,
                    p.categories,
                    COUNT(DISTINCT ps.skill_id) FILTER (WHERE ps.skill_id = ANY($1::int[])) AS matching_skills,
                    COUNT(DISTINCT ps.skill_id) AS total_skills
                FROM projects p
                JOIN users u ON p.client_id = u.id
                LEFT JOIN project_skills ps ON p.id = ps.project_id
                WHERE p.status = 'open'
                AND p.id NOT IN (
                    SELECT project_id FROM proposals WHERE freelancer_id = $2
                )
                AND p.budget BETWEEN $3 AND $4
                GROUP BY p.id, u.name
            )
            SELECT 
                psm.*,
                CASE 
                    WHEN psm.total_skills = 0 THEN 0
                    ELSE (psm.matching_skills::float / psm.total_skills) * 100 
                END AS skill_match_percentage,
                CASE
                    WHEN 5 IS NULL THEN 0
                    WHEN psm.expected_work_hours IS NULL THEN 0
                    WHEN ABS(psm.expected_work_hours - $5) < 10 THEN 10
                    WHEN ABS(psm.expected_work_hours - $5) < 20 THEN 5
                    ELSE 0
                END AS hours_match_score
            FROM project_skill_matches psm
            ORDER BY 
                (CASE 
                    WHEN psm.total_skills = 0 THEN 0
                    ELSE (psm.matching_skills::float / psm.total_skills) * 50 
                END) +
                CASE
                    WHEN psm.budget BETWEEN $3 AND $4 THEN 10
                    ELSE 0
                END +
                CASE
                    WHEN $5 IS NULL THEN 0
                    WHEN psm.expected_work_hours IS NULL THEN 0
                    WHEN ABS(psm.expected_work_hours - $5) < 10 THEN 10
                    WHEN ABS(psm.expected_work_hours - $5) < 20 THEN 5
                    ELSE 0
                END DESC
            LIMIT 20
        `;

        const recommendedProjects = await pool.query(recommendationsQuery, [
            userSkills,
            freelancerId,
            minBudget,
            maxBudget,
            preferredWorkHours
        ]);

        res.json({
            recommended_projects: recommendedProjects.rows,
            factors: {
                skill_match: userSkills.length > 0,
                budget_preference: preferencesResult.rows.length > 0,
                project_history: historyResult.rows.length > 0,
                hours_preference: preferredWorkHours !== null
            }
        });
    } catch (err) {
        console.error('Error generating recommendations:', err);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

/**
 * POST /api/recommendations/preferences
 * Update freelancer preferences for recommendations
 */
router.post('/preferences', requireFreelancer, async (req, res) => {
    const { min_budget, max_budget, expected_work_hours } = req.body;
    const userId = req.user.id;

    try {
        // Validate inputs
        if (min_budget !== null && min_budget !== undefined && isNaN(parseFloat(min_budget))) {
            return res.status(400).json({ error: 'min_budget must be a number' });
        }

        if (max_budget !== null && max_budget !== undefined && isNaN(parseFloat(max_budget))) {
            return res.status(400).json({ error: 'max_budget must be a number' });
        }

        if (expected_work_hours !== null && expected_work_hours !== undefined && isNaN(parseInt(expected_work_hours))) {
            return res.status(400).json({ error: 'expected_work_hours must be a number' });
        }

        // Upsert preferences
        await pool.query(
            `INSERT INTO freelancer_preferences (user_id, min_budget, max_budget, expected_work_hours)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                min_budget = $2,
                max_budget = $3,
                expected_work_hours = $4,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, min_budget, max_budget, expected_work_hours]
        );

        res.json({ success: true, message: 'Preferences updated successfully' });
    } catch (err) {
        console.error('Error updating preferences:', err);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

module.exports = router;