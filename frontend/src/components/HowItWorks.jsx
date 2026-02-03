import React from "react";
import { LightBulbIcon, HandThumbUpIcon, BookOpenIcon } from "@heroicons/react/24/solid";

const steps = [
  {
    title: "Post a Skill",
    description: "Share your expertise with the community and make your skills accessible to others.",
    icon: <LightBulbIcon className="h-12 w-12 text-primary mb-4 mx-auto" />,
    bgColor: "bg-blue-50"
  },
  {
    title: "Request an Exchange",
    description: "Find someone with a skill you want to learn and request an exchange.",
    icon: <HandThumbUpIcon className="h-12 w-12 text-green-500 mb-4 mx-auto" />,
    bgColor: "bg-green-50"
  },
  {
    title: "Learn Together",
    description: "Grow together as a community, exchanging knowledge without monetary barriers.",
    icon: <BookOpenIcon className="h-12 w-12 text-yellow-500 mb-4 mx-auto" />,
    bgColor: "bg-yellow-50"
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-background py-20">
      <h2 className="text-primary text-4xl font-bold text-center mb-16">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-12 px-6 md:px-20">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`${step.bgColor} rounded-xl shadow-md p-8 flex flex-col items-center text-center`}
          >
            {step.icon}
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-gray-700">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}