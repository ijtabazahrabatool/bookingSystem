import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ServiceCard({ service, onBook }) {
  const { user } = useContext(AuthContext);
  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-start overflow-hidden">
      <div className="absolute top-0 right-0 bg-indigo-50 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl mb-4 z-10 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        <i className={`fa-solid ${service.image}`}></i>
      </div>
      <div className="flex justify-between w-full items-start z-10">
        <div>
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">{service.category}</span>
          <h3 className="text-xl font-bold text-slate-800 mt-1">{service.name}</h3>
        </div>
        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
          <i className="fa-solid fa-star text-yellow-400 text-xs mr-1"></i>
          <span className="text-sm font-bold text-slate-700">{service.rating}</span>
        </div>
      </div>
      <p className="text-slate-500 text-sm mt-3 mb-4 line-clamp-2 z-10">{service.description}</p>
      <div className="mt-auto w-full flex items-center justify-between border-t border-slate-100 pt-4 z-10">
        <div className="flex flex-col">
          <span className="text-slate-400 text-xs">Price</span>
          <span className="text-lg font-bold text-slate-900">${service.price}</span>
        </div>
        <div className="flex flex-col mx-4">
          <span className="text-slate-400 text-xs">Duration</span>
          <span className="text-sm font-medium text-slate-700">{service.duration} min</span>
        </div>
        {user?.role === 'provider' ? (
           <button 
             disabled
             className="px-4 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed"
           >
             Provider
           </button>
        ) : (
           <button 
             onClick={() => onBook(service)}
             className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
           >
             Book
           </button>
        )}
      </div>
    </div>
  );
}

