import { useEffect, useState } from "react";
import axios from "axios";

function Profile() {
  const [users, setUsers] = useState([]);

  const handleDelete = (email) => {
    axios
      .delete(`http://localhost:5000/users/${email}`)
      .then(() => {
        setUsers((prev) => prev.filter((u) => u.email !== email));
      })
      .catch((err) => {
        console.error("Delete failed:", err);
      });
  };

  useEffect(() => {
    axios.get("http://localhost:5000/users").then((res) => {
      setUsers(res.data);
    });
  }, []);

  return (
    <div className="profile-container">
      <h2>Users</h2>

      {users.map((user, index) => (
        <div key={index} className="user-card">
          <img src={user.profileImage} alt={user.name} />
          <div className="user-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <button
            className="delete-btn"
            onClick={() => handleDelete(user.email)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Profile;
