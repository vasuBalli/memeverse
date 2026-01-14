"use client"
import { useState } from 'react';
import { motion } from 'motion/react';
import { mockTemplates } from '../data/mockTemplates';
import { Play, Clock, Layers } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function TemplatesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <div className="mb-8">
        <h2 className="gradient-text text-2xl font-bold">Video Templates</h2>
        <p className="text-[#6B6B7B] mt-2">
          Create professional edits in seconds with our trending templates.
        </p>
      </div>
       <div className="bg-blue-600 text-red-500 p-10  text-2xl">
      Tailwind Working
    </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link 
              href={`/templates/${template.id}`}
              className="group block bg-[#15151F] rounded-2xl overflow-hidden border border-white/5 hover:border-[#6C5CE7]/50 transition-all hover:-translate-y-1"
            >
              <div className="aspect-[9/16] relative overflow-hidden">
                <Image
                  src={template.thumbnailUrl} 
                  alt={template.name}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg mb-1">{template.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{template.duration}s</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>{template.requiredMedia.length} Clips</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
