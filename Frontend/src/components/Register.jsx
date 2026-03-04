import { useState } from "react";
import axios from "axios";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleRegister = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/generate-upload-url",
        {
          userId: email,
          fileType: file.type,
          fileSize: file.size,
        },
      );

      const { uploadUrl, fileName } = response.data;

      console.log("Upload URL:", uploadUrl);

      await axios.put(uploadUrl, file, {
        headers: {
          "x-ms-blob-type": "BlockBlob",
        },
      });

      console.log("File uploaded successfully");

      const imageUrl = `https://ashokstorage2003.blob.core.windows.net/profile-images/${fileName}`;
      console.log("Image URL:", imageUrl);

      const resData = await axios.post("http://localhost:5000/register", {
        name,
        email,
        profileImage: imageUrl,
      });

      const userData = resData.data.message;
      console.log("User registered successfully:", userData);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Register</h2>

      <div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <br />

      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <br />

      <div>
        <input
          type="file"
          onChange={(e) => {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
          }}
        />
      </div>

      <br />
      {preview && (
        <div>
          <h4>Preview</h4>
          <img src={preview} width="200" />
        </div>
      )}
      <br />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

export default Register;
