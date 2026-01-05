import React from 'react';

const About = () => {
  return (
    <section id = "vision" className="bg-white text-gray-800 px-6 py-12 md:px-24 lg:px-36">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
About Us 
       </h2>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-gray-100 p-6 rounded-lg shadow-md hover:shadow-lg transition md:col-span-3">
            <p>
Track Expenses is a simple and intuitive platform designed to help you take control of your expenditure. We believe managing money shouldn’t be complicated, we’ve built a tool that makes tracking your income and expenses clear, fast, and stress-free.
</p> 
 </div>

        </div>
      </div>
    </section>
  );
};

export default About;
