import React from 'react';

export default function ProjectCard({ project }) {
  return (
    <div className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-mzansi/40 hover:bg-white/[0.05] transition-all duration-300 shadow-xl">
      
      {/* Top Row: User and Date */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-mzansi to-emerald-900 flex items-center justify-center text-[10px] text-black font-bold">
            {project.owner?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm text-gray-400 font-medium group-hover:text-gray-200 transition-colors">
            @{project.owner.username}
          </span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">
          {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Just now'}
        </span>
      </div>

      {/* Content: Title & Description */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white group-hover:text-mzansi transition-colors mb-2">
          {project.title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
          {project.description}
        </p>
      </div>

      {/* Project Metadata Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="px-2 py-1 rounded bg-mzansi/10 border border-mzansi/20 text-mzansi text-[10px] font-mono uppercase tracking-widest">
          {project.stage}
        </div>
        {project.support_needed && (
          <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono uppercase">
            Looking for: {project.support_needed}
          </div>
        )}
      </div>

      {/* Bottom Row: Actions (Your original buttons, but styled) */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
        <button 
          type="button" 
          className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 transition-all hover:text-white"
        >
          Comment
        </button>
        <button 
          type="button" 
          className="flex-1 py-2 bg-mzansi/10 hover:bg-mzansi border border-mzansi/20 hover:text-black rounded-xl text-xs font-bold text-mzansi transition-all shadow-[0_0_10px_rgba(0,223,130,0.1)] hover:shadow-[0_0_15px_rgba(0,223,130,0.3)]"
        >
          Raise Hand 
        </button>
      </div>
    </div>
  );
}