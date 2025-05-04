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
 * 4. Project category preferences
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
            `SELECT min_budget, max_budget, preferred_categories
             FROM freelancer_preferences
             WHERE user_id = $1`,
            [freelancerId]
        );

        // Default preferences if none set
        let minBudget = 0;
        let maxBudget = Number.MAX_SAFE_INTEGER;
        let preferredCategories = [];

        if (preferencesResult.rows.length > 0) {
            const prefs = preferencesResult.rows[0];
            minBudget = prefs.min_budget || minBudget;
            maxBudget = prefs.max_budget || maxBudget;
            preferredCategories = prefs.preferred_categories || [];
        }

        // Step 3: Get the freelancer's successful project history
        const historyResult = await pool.query(
            `SELECT p.id, p.categories, ps.skill_id
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

        historyResult.rows.forEach(row => {
            if (row.skill_id) successfulProjectSkills.add(row.skill_id);
            if (row.categories) {
                const cats = Array.isArray(row.categories) ? row.categories : [];
                cats.forEach(cat => successfulCategories.add(cat));
            }
        });

        // Step 4: Find recommended projects based on all factors
        // Using jsonb_array_elements to handle array comparisons properly
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
                    WHEN EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements(psm.categories) AS proj_cat
                        WHERE proj_cat::text IN (
                            SELECT jsonb_array_elements_text($5::jsonb)
                        )
                    ) THEN 30
                    ELSE 0
                END AS category_match_score
            FROM project_skill_matches psm
            ORDER BY 
                (CASE 
                    WHEN psm.total_skills = 0 THEN 0
                    ELSE (psm.matching_skills::float / psm.total_skills) * 60 
                END) +
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements(psm.categories) AS proj_cat
                        WHERE proj_cat::text IN (
                            SELECT jsonb_array_elements_text($5::jsonb)
                        )
                    ) THEN 30
                    ELSE 0
                END +
                CASE
                    WHEN psm.budget BETWEEN $3 AND $4 THEN 10
                    ELSE 0
                END DESC
            LIMIT 20
        `;

        const recommendedProjects = await pool.query(recommendationsQuery, [
            userSkills,
            freelancerId,
            minBudget,
            maxBudget,
            JSON.stringify(Array.from(successfulCategories))
        ]);

        res.json({
            recommended_projects: recommendedProjects.rows,
            factors: {
                skill_match: userSkills.length > 0,
                budget_preference: preferencesResult.rows.length > 0,
                project_history: historyResult.rows.length > 0,
                category_preference: preferredCategories.length > 0
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
    const { min_budget, max_budget, preferred_categories } = req.body;
    const userId = req.user.id;

    try {
        // Upsert preferences
        await pool.query(
            `INSERT INTO freelancer_preferences (user_id, min_budget, max_budget, preferred_categories)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                min_budget = $2,
                max_budget = $3,
                preferred_categories = $4,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, min_budget, max_budget, JSON.stringify(preferred_categories)]
        );

        res.json({ success: true, message: 'Preferences updated successfully' });
    } catch (err) {
        console.error('Error updating preferences:', err);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

module.exports = router;