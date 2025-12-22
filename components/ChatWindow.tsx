
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { getAIResponse } from '../services/geminiService';
import { dataService } from '../services/dataService';

interface ChatWindowProps {
  currentUser: User;
  targetUser: User | { name: string, id: string, avatar: string }; 
  isAI?: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, targetUser, isAI, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = () => {
    if (!isAI) {
      const history = dataService.getMessages(currentUser.id, targetUser.id);
      setMessages(history);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadHistory();
  }, [currentUser.id, targetUser.id, isAI]);

  // 监听同步消息（其他窗口或本窗口的消息保存）
  useEffect(() => {
    if (isAI) return;
    const handleSync = () => {
      loadHistory();
    };
    window.addEventListener('storage', handleSync);
    // 同时开启一个小定时器作为保底同步（防止 storage 事件在某些边缘情况下不触发）
    const interval = setInterval(loadHistory, 3000);
    
    return () => {
      window.removeEventListener('storage', handleSync);
      clearInterval(interval);
    };
  }, [currentUser.id, targetUser.id, isAI]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: targetUser.id,
      text: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    if (isAI) {
      setIsTyping(true);
      const history = messages.map(m => ({
        role: m.senderId === currentUser.id ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      
      const responseText = await getAIResponse(inputValue, history);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'AI',
        receiverId: currentUser.id,
        text: responseText,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    } else {
      // 保存消息到 localStorage
      dataService.saveMessage(userMsg);
      
      // 模拟一点点“正在输入”的反馈感
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-96 h-full sm:h-[600px] bg-white shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col z-[100] animate-slide-up border border-gray-100">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={targetUser.avatar} className="w-10 h-10 rounded-full border-2 border-white/20" alt="" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full"></div>
          </div>
          <div className="text-left">
            <h4 className="font-bold text-sm">{targetUser.name}</h4>
            <p className="text-[10px] text-indigo-100">{isAI ? 'AI 心理助手' : '在线沟通中'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.length === 0 && (
          <div className="text-center mt-10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <i className="fas fa-comment-dots text-indigo-300 text-2xl"></i>
            </div>
            <p className="text-sm text-gray-400 px-6">
              {isAI ? '我是你的 AI 心理伙伴，可以跟我聊聊任何心事。' : `这是您与 ${targetUser.name} 的对话起点。`}
            </p>
          </div>
        )}
        
        {messages.map((m) => {
          const isMe = m.senderId === currentUser.id;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm text-left ${
                isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
              }`}>
                {m.text}
                <div className={`text-[9px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t rounded-b-2xl">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入您的消息..."
            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
