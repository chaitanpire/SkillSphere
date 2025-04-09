import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ProfilePage() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`http://localhost:4000/api/users/${id}`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                setUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    if (loading) return <p>Loading profile...</p>;
    if (error) return <p>Error loading profile: {error}</p>;

    return (
        <div>
            <h1>{user.name}'s Profile</h1>
            <p>Role: {user.role}</p>
            <p>Email: {user.email}</p>
            {user.profile ? (
                <>
                    <p>Bio: {user.profile.bio}</p>
                    <p>Location: {user.profile.location}</p>
                    <p>Hourly Rate: ${user.profile.hourly_rate}</p>
                    <p>Experience: {user.profile.experience} years</p>
                    <p>Rating: ⭐ {user.profile.rating}</p>
                </>
            ) : (
                <p>No profile data yet.</p>
            )}
        </div>
    );
}