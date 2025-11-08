import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const Bio_form = ({ user, setHasBio }) => {
  // Top-level user doc
  const userDocRef = doc(db, "Users", user.uid);

  // Role-specific subcollection docs
  const ResAttributeDoc = doc(userDocRef, "ResidentAttributes", "profile");
  const StuAttributeDoc = doc(userDocRef, "StudentAttributes", "profile");
  const BusAttributeDoc = doc(userDocRef, "BusinessAttributes", "profile");

  const [ResBioData, setResBioData] = useState({
    name: "",
    age: "",
    zipCode: "",
  });

  const [StuBioData, setStuBioData] = useState({
    name: "",
    age: "",
    schoolName: "",
  });

  const [BusBioData, setBusBioData] = useState({
    name: "",
    age: "",
    businessAddress: "",
    description: "",
    phoneNumber: "",
  });

  // Example update functions:
  const updateResData = (field, value) => {
    setResBioData((prev) => ({ ...prev, [field]: value }));
  };

  const updateStuData = (field, value) => {
    setStuBioData((prev) => ({ ...prev, [field]: value }));
  };

  const updateBusData = (field, value) => {
    setBusBioData((prev) => ({ ...prev, [field]: value }));
  };

  // Route shared inputs (age, etc.) to the correct role-specific updater
  const routeUpdate = (field, value) => {
    if (!user) return;
    if (user.role === "resident") updateResData(field, value);
    else if (user.role === "student") updateStuData(field, value);
    else if (user.role === "business") updateBusData(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // 1) Mark top-level user doc as having a bio
    await setDoc(
      userDocRef,
      {
        role: user.role,
        hasBio: true,
        name: user.name || "",
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2) Write to the appropriate subcollection doc under the user
    if (user.role === "resident") {
      await setDoc(
        ResAttributeDoc,
        {
          ...ResBioData,
          hasBio: true,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } else if (user.role === "student") {
      await setDoc(
        StuAttributeDoc,
        {
          ...StuBioData,
          hasBio: true,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } else if (user.role === "business") {
      await setDoc(
        BusAttributeDoc,
        {
          ...BusBioData,
          hasBio: true,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    setHasBio(true);
  };

  return (
    <>
      <div className="bio-page">
        <h2 className="bio-header">Welcome to the App!</h2>
        <p className="bio-subtitle">Please complete your bio to continue.</p>
        <form onSubmit={handleSubmit} className="bio-form">
          <input
            type="text"
            placeholder="Age"
            required
            onChange={(e) => routeUpdate("age", e.target.value)}
          />

          {user.role === "resident" && (
            <input
              type="number"
              placeholder="Zip Code"
              onChange={(e) => updateResData("zipCode", e.target.value)}
            />
          )}

          {user.role === "student" && (
            <div>
              <input
                type="text"
                placeholder="School Name"
                onChange={(e) => updateStuData("schoolName", e.target.value)}
              />
            </div>
          )}

          {user.role === "business" && (
            <div>
              <input
                type="text"
                placeholder="Business Address"
                onChange={(e) =>
                  updateBusData("businessAddress", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Description"
                onChange={(e) => updateBusData("description", e.target.value)}
              />
              <input
                type="number"
                placeholder="Phone Number"
                onChange={(e) => updateBusData("phoneNumber", e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="ai-button ai-button-primary">
            Complete Bio
          </button>
        </form>
      </div>
    </>
  );
};

export default Bio_form;
