import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />
      <Hero
        onGetStarted={() => navigate("/register")}
        onExploreSkills={() => navigate("/skills")}
      />
      <HowItWorks />
    </div>
  );
}