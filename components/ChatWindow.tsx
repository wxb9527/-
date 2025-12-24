
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
  
  // 拖拽与缩放状态
  const [pos, setPos] = useState({ x: window.innerWidth > 640 ? window.innerWidth - 420 : 0, y: window.innerHeight > 640 ? window.innerHeight - 620 : 0 });
  const [size, setSize] = useState({ w: 384, h: 580 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = () => {
    if (!isAI) {
      const history = dataService.getMessages(currentUser.id, targetUser.id);
      setMessages(history);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser.id, targetUser.id, isAI]);

  useEffect(() => {
    if (isAI) return;
    const handleSync = () => loadHistory();
    window.addEventListener('storage', handleSync);
    const interval = setInterval(loadHistory, 1000); // 加快同步频率
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

  // 拖拽逻辑
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAI && window.innerWidth < 640) return; // 移动端禁用拖拽
    setIsDragging(true);
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  // 缩放逻辑
  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
      }
      if (isResizing) {
        setSize({ 
          w: Math.max(300, e.clientX - pos.x), 
          h: Math.max(400, e.clientY - pos.y) 
        });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, pos]);

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
      const aiMsg: Message = { id: (Date.now() + 1).toString(), senderId: 'AI', receiverId: currentUser.id, text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    } else {
      dataService.saveMessage(userMsg);
    }
  };

  return (
    <div 
      className="fixed bg-white shadow-2xl flex flex-col z-[100] border border-gray-100 overflow-hidden sm:rounded-2xl touch-none"
      style={{
        left: window.innerWidth < 640 ? 0 : pos.x,
        top: window.innerWidth < 640 ? 0 : pos.y,
        width: window.innerWidth < 640 ? '100%' : size.w,
        height: window.innerWidth < 640 ? '100%' : size.h,
        transition: isDragging || isResizing ? 'none' : 'all 0.1s'
      }}
    >
      {/* Header - 拖拽区域 */}
      <div 
        onMouseDown={handleMouseDown}
        className="bg-indigo-600 p-4 flex items-center justify-between text-white cursor-move select-none shrink-0"
      >
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
        <div className="flex items-center gap-2">
          <button onClick={() => setSize({ w: 384, h: 580 })} className="hidden sm:block p-1 hover:bg-white/10 rounded" title="重置大小"><i className="fas fa-compress-arrows-alt text-xs"></i></button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors"><i className="fas fa-times text-xl"></i></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center mt-10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <i className="fas fa-comment-dots text-indigo-300 text-2xl"></i>
            </div>
            <p className="text-sm text-gray-400 px-6">{isAI ? '我是你的 AI 心理伙伴，可以跟我聊聊任何心事。' : `这是您与 ${targetUser.name} 的对话起点。系统仅保留最近7天的记录。`}</p>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.senderId === currentUser.id;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm text-left ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'}`}>
                {m.text}
                <div className={`text-[9px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
      <div className="p-4 bg-white border-t shrink-0">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入您的消息..."
            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button onClick={handleSend} disabled={!inputValue.trim()} className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"><i className="fas fa-paper-plane"></i></button>
        </div>
      </div>

      {/* Resize Handle - 缩放手柄 */}
      <div 
        onMouseDown={handleResizeDown}
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 group"
      >
        <div className="w-3 h-3 border-r-2 border-b-2 border-gray-200 group-hover:border-indigo-400 transition-colors"></div>
      </div>
    </div>
  );
};

export default ChatWindow;
