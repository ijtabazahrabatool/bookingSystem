import React, { useState, useEffect } from "react";
import { getAvailability, setAvailability } from "../services/api";
import { SkeletonCard } from "./LoadingSkeleton";
import { useToast } from "./Toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProviderAvailability() {
  const { showToast } = useToast();
  const [availability, setAvailabilityData] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const [formData, setFormData] = useState({
    dayOfWeek: "",
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    breaks: [],
    blockedSlots: []
  });
  const [newBreak, setNewBreak] = useState({ start: "", end: "" });
  const [newBlocked, setNewBlocked] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await getAvailability();
      const availMap = {};
      response.data.forEach(avail => {
        availMap[avail.dayOfWeek] = avail;
      });
      setAvailabilityData(availMap);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDay = (day) => {
    const existing = availability[day];
    setFormData({
      dayOfWeek: day,
      startTime: existing?.startTime || "09:00",
      endTime: existing?.endTime || "17:00",
      slotDuration: existing?.slotDuration || 30,
      breaks: existing?.breaks || [],
      blockedSlots: existing?.blockedSlots || []
    });
    setEditingDay(day);
  };

  const handleAddBreak = () => {
    if (newBreak.start && newBreak.end) {
      setFormData({
        ...formData,
        breaks: [...formData.breaks, { ...newBreak }]
      });
      setNewBreak({ start: "", end: "" });
    }
  };

  const handleRemoveBreak = (index) => {
    setFormData({
      ...formData,
      breaks: formData.breaks.filter((_, i) => i !== index)
    });
  };

  const handleAddBlocked = () => {
    if (newBlocked.start && newBlocked.end) {
      setFormData({
        ...formData,
        blockedSlots: [...formData.blockedSlots, { ...newBlocked }]
      });
      setNewBlocked({ start: "", end: "" });
    }
  };

  const handleRemoveBlocked = (index) => {
    setFormData({
      ...formData,
      blockedSlots: formData.blockedSlots.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    try {
      await setAvailability(formData);
      await fetchAvailability();
      setEditingDay(null);
      showToast("Availability saved successfully!", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save availability", "error");
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Availability</h1>
        <p className="text-gray-600">Set your working hours and breaks for each day</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS.map(day => {
          const dayData = availability[day];
          const isConfigured = !!dayData;
          const isEditing = editingDay === day;

          return (
            <div
              key={day}
              className={`bg-white rounded-xl p-6 shadow-soft border-2 ${
                isEditing ? "border-primary-500" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{day}</h3>
                {!isEditing && (
                  <button
                    onClick={() => handleEditDay(day)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    {isConfigured ? "Edit" : "Configure"}
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          // If end time is before new start time, update end time
                          if (formData.endTime && newStart >= formData.endTime) {
                            const [hours, minutes] = newStart.split(':').map(Number);
                            const newEnd = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            setFormData({ ...formData, startTime: newStart, endTime: newEnd });
                          } else {
                            setFormData({ ...formData, startTime: newStart });
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          // Ensure end time is after start time
                          if (formData.startTime && newEnd <= formData.startTime) {
                            return; // Don't update if invalid
                          }
                          setFormData({ ...formData, endTime: newEnd });
                        }}
                        min={formData.startTime ? (() => {
                          // Calculate minimum end time (1 minute after start)
                          const [startH, startM] = formData.startTime.split(':').map(Number);
                          const minMinutes = (startH * 60 + startM + 1) % (24 * 60);
                          const minH = Math.floor(minMinutes / 60);
                          const minM = minMinutes % 60;
                          return `${String(minH).padStart(2, '0')}:${String(minM).padStart(2, '0')}`;
                        })() : "00:01"}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Slot Duration (min)</label>
                    <input
                      type="number"
                      value={formData.slotDuration}
                      onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) || 30 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="15"
                      step="15"
                    />
                  </div>

                  {/* Breaks */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Breaks</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="time"
                        value={newBreak.start}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          // If end time is before or equal to new start time, update end time
                          if (newBreak.end && newStart >= newBreak.end) {
                            const [hours, minutes] = newStart.split(':').map(Number);
                            const newEnd = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            setNewBreak({ start: newStart, end: newEnd });
                          } else {
                            setNewBreak({ ...newBreak, start: newStart });
                          }
                        }}
                        placeholder="Start"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="time"
                        value={newBreak.end}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          // Ensure end time is after start time
                          if (newBreak.start && newEnd <= newBreak.start) {
                            return; // Don't update if invalid
                          }
                          setNewBreak({ ...newBreak, end: newEnd });
                        }}
                        min={newBreak.start ? (() => {
                          // Calculate minimum end time (1 minute after start)
                          const [startH, startM] = newBreak.start.split(':').map(Number);
                          const minMinutes = (startH * 60 + startM + 1) % (24 * 60);
                          const minH = Math.floor(minMinutes / 60);
                          const minM = minMinutes % 60;
                          return `${String(minH).padStart(2, '0')}:${String(minM).padStart(2, '0')}`;
                        })() : "00:01"}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={handleAddBreak}
                        className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {formData.breaks.map((br, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                          <span>{br.start} - {br.end}</span>
                          <button
                            onClick={() => handleRemoveBreak(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blocked Slots */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Blocked Slots</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="time"
                        value={newBlocked.start}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          // If end time is before or equal to new start time, update end time
                          if (newBlocked.end && newStart >= newBlocked.end) {
                            const [hours, minutes] = newStart.split(':').map(Number);
                            const newEnd = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            setNewBlocked({ start: newStart, end: newEnd });
                          } else {
                            setNewBlocked({ ...newBlocked, start: newStart });
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="time"
                        value={newBlocked.end}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          // Ensure end time is after start time
                          if (newBlocked.start && newEnd <= newBlocked.start) {
                            return; // Don't update if invalid
                          }
                          setNewBlocked({ ...newBlocked, end: newEnd });
                        }}
                        min={newBlocked.start ? (() => {
                          // Calculate minimum end time (1 minute after start)
                          const [startH, startM] = newBlocked.start.split(':').map(Number);
                          const minMinutes = (startH * 60 + startM + 1) % (24 * 60);
                          const minH = Math.floor(minMinutes / 60);
                          const minM = minMinutes % 60;
                          return `${String(minH).padStart(2, '0')}:${String(minM).padStart(2, '0')}`;
                        })() : "00:01"}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={handleAddBlocked}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {formData.blockedSlots.map((bl, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-red-50 p-2 rounded">
                          <span>{bl.start} - {bl.end}</span>
                          <button
                            onClick={() => handleRemoveBlocked(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDay(null)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {isConfigured ? (
                    <div className="text-sm text-gray-600">
                      <p>{dayData.startTime} - {dayData.endTime}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dayData.breaks?.length || 0} break(s), {dayData.blockedSlots?.length || 0} blocked
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not configured</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

