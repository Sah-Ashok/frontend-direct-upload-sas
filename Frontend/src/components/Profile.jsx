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
    <div style={{ padding: "40px" }}>
      <h2>Users</h2>

      {users.map((user, index) => (
        <div key={index} style={{ marginBottom: "20px" }}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>

          <img src={user.profileImage} width="150" />

          <button
            onClick={() => handleDelete(user.email)}
            style={{
              marginTop: "10px",
              color: "white",
              background: "red",
              border: "none",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default Profile;
