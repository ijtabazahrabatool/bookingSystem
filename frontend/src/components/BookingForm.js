import React, { useState } from "react";
import axios from "axios";

export default function BookingForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    service: "",
    stylist: "",
    price: 0
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitForm = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5001/api/bookings", form);
      alert("Booking saved!");
      // Reset form after successful submission
      setForm({
        name: "",
        phone: "",
        date: "",
        service: "",
        stylist: "",
        price: 0
      });
    } catch (error) {
      console.error("Booking error:", error);
      alert(`Error: ${error.response?.data?.message || error.message || "Failed to save booking"}`);
    }
  };

  return (
    <section id="book">
      <h2>Book Appointment</h2>
      <form onSubmit={submitForm}>
        <input name="name" onChange={handleChange} placeholder="Name" />
        <input name="phone" onChange={handleChange} placeholder="Phone" />
        <input type="date" name="date" onChange={handleChange} />

        <select name="service" onChange={handleChange}>
          <option value="">Select Service</option>
          <option value="Haircut">Haircut</option>
          <option value="Facial">Facial</option>
          <option value="Nails">Nails</option>
        </select>

        <select name="stylist" onChange={handleChange}>
          <option value="">Select Stylist</option>
          <option value="Alice">Alice</option>
          <option value="Maria">Maria</option>
        </select>

        <button type="submit">Book Now</button>
      </form>
    </section>
  );
}
