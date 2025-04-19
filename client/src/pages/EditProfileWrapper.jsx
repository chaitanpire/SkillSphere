import React from 'react';
import { useParams } from 'react-router-dom';
import EditProfile from './EditProfile';

function EditProfileWrapper() {
    const { id } = useParams();
    return <EditProfile key={id} />; // Key forces remount on ID change
}

export default EditProfileWrapper;