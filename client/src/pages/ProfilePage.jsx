import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ProfilePage() {
    const { id } = useParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:4000/api/users/${id}`)
            .then(res => res.json())
            .then(data => setUser(data));
    }, [id]);

    if (!user) return <p>Loading profile...</p>;

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
