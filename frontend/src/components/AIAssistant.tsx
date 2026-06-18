"use client";

import React, { useState, useRef, useEffect } from "react";
import { chatWithAgentAction } from "@/app/actions/ai";
import {
  Bot,
  Send,
  Sparkles,
  User,
  GraduationCap,
  CalendarDays,
  Target,
  Flame,
  Briefcase,
  Layers,
  ArrowRight
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "agent";
  agentName?: string;
  text: string;
  suggestions?: string[];
  timestamp: Date;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "agent",
      agentName: "Orchestrator",
      text: "Hello! I am your Cadence Academic Operating System Assistant. I coordinate specialized agents to help you schedule study sessions, break down course concepts, analyze deadlines, optimize your focus habits, and plan your career path. What would you like to discuss today?",
      suggestions: [
        "Optimize my study plan",
        "Explain Singular Value Decomposition",
        "Check my upcoming deadline risks",
        "Internship roadmaps for AI"
      ],
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("orchestrator");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const agentTabs = [
    { id: "orchestrator", label: "Orchestrator", icon: Layers, desc: "Auto-classify query" },
    { id: "planner", label: "Planner", icon: CalendarDays, desc: "Schedule & time blocking" },
    { id: "academic", label: "Academic", icon: GraduationCap, desc: "Tutoring & concepts" },
    { id: "productivity", label: "Productivity", icon: Target, desc: "Focus & habit coach" },
    { id: "deadline", label: "Deadline", icon: Flame, desc: "Stress & risk alerts" },
    { id: "career", label: "Career", icon: Briefcase, desc: "Internships & roadmaps" }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // Execute Next.js Server Action
      const agentOverride = selectedAgent === "orchestrator" ? undefined : selectedAgent;
      const result = await chatWithAgentAction(textToSend, agentOverride);

      const agentMsg: Message = {
        id: Math.random().toString(),
        sender: "agent",
        agentName: result.agentName,
        text: result.responseHtml,
        suggestions: result.followUpSuggestions,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: "agent",
        agentName: "System",
        text: err.message || "Something went wrong while communicating with the agents. Please check your Gemini API key.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-3xl border border-line bg-white/60 shadow-soft backdrop-blur-xl overflow-hidden lg:flex-row">
      
      {/* Sidebar - Agent Details */}
      <div className="w-full shrink-0 border-b border-line bg-slate-50/50 p-4 lg:w-72 lg:border-b-0 lg:border-r lg:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Agent Network</h3>
        <p className="mt-1 text-xs text-muted">Direct your query to a specific expert or let the orchestrator route it.</p>
        
        <div className="mt-4 flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {agentTabs.map((tab) => {
            const Icon = tab.icon;
            const active = selectedAgent === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedAgent(tab.id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition text-xs font-semibold w-full shrink-0 max-w-[150px] lg:max-w-none ${
                  active 
                    ? "bg-primary text-white shadow-glow" 
                    : "bg-white border border-line hover:bg-slate-100 text-slate-700"
                }`}
              >
                <Icon size={16} className={active ? "text-white" : "text-primary"} />
                <div>
                  <p className="font-bold">{tab.label}</p>
                  <p className={`hidden text-[9px] font-normal tracking-wide lg:block ${active ? "text-blue-100" : "text-muted"}`}>
                    {tab.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat workspace */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white/40">
        
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isAgent = msg.sender === "agent";
            return (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isAgent ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
                
                {/* Avatar */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-soft ${
                  isAgent 
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-500" 
                    : "bg-gradient-to-tr from-slate-600 to-slate-800"
                }`}>
                  {isAgent ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Bubble */}
                <div className="space-y-1.5">
                  {isAgent && msg.agentName && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary ml-1">
                      {msg.agentName}
                    </span>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                    isAgent 
                      ? "bg-slate-100 text-slate-800 border border-slate-200/50" 
                      : "bg-primary text-white shadow-soft"
                  }`}>
                    {/* Render simple markdown formats like bold, lists, codeblocks */}
                    <div className="whitespace-pre-wrap font-medium">
                      {msg.text}
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  {isAgent && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-1 pl-1">
                      {msg.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSendMessage(suggestion)}
                          className="flex items-center gap-1 rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-blue-50"
                        >
                          {suggestion}
                          <ArrowRight size={10} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 mr-auto items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white animate-spin">
                <Sparkles size={16} />
              </div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider animate-pulse">
                Agents consulting...
              </p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input panel */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="border-t border-line p-4 flex gap-3 bg-slate-50/50"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask the ${selectedAgent === "orchestrator" ? "agents" : selectedAgent + " agent"} anything...`}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-glow transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>

      </div>
    </div>
  );
}
