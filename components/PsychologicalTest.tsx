
import React, { useState } from 'react';
import { HealthTag } from '../types';

interface PsychologicalTestProps {
  onComplete: (tag: HealthTag, score: number) => void;
  onCancel: () => void;
}

const QUESTIONS = [
  "我感觉自己精神状态良好，对未来充满希望。",
  "我最近睡眠质量很高，很少失眠或早醒。",
  "我能够很好地控制自己的情绪，不易发火。",
  "我感觉自己有足够的能力去解决学习和生活中的困难。",
  "我乐于参加社交活动，并能从与人交往中获得快乐。",
  "我能够集中注意力学习，且效率较高。",
  "我很少感到莫名其妙的紧张、焦虑或担心。",
  "我对平时的爱好仍然保持浓厚的兴趣。",
  "我感到身体健康，不容易疲劳或感到精力不济。",
  "我能虚心接受他人的批评，并从中吸取教训。",
  "我觉得生活充满了意义，每天都过得很充实。",
  "我不容易陷入自责或自我怀疑中。",
  "我能够坦然面对失败，并能很快从中走出来。",
  "我感觉身边的朋友和家人都很支持和理解我。",
  "我从未有过伤害自己或结束生命的想法。"
];

const PsychologicalTest: React.FC<PsychologicalTestProps> = ({ onComplete, onCancel }) => {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (val: boolean) => {
    const nextAnswers = { ...answers, [currentStep]: val };
    setAnswers(nextAnswers);
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  };

  const calculateResult = () => {
    const score = Object.values(answers).filter(v => v === true).length;
    let tag: HealthTag = '健康';
    if (score >= 12) tag = '健康';
    else if (score >= 8) tag = '亚健康';
    else tag = '不健康';
    return { score, tag };
  };

  const { score, tag } = calculateResult();

  if (showResult) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[250] animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-bounce-in text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${tag === '健康' ? 'bg-green-100 text-green-600' : tag === '亚健康' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
            <i className={`fas ${tag === '健康' ? 'fa-check-circle' : tag === '亚健康' ? 'fa-exclamation-circle' : 'fa-times-circle'} text-4xl`}></i>
          </div>
          <h2 className="text-2xl font-bold mb-2">测试完成！</h2>
          <p className="text-gray-500 mb-1">您的得分：<span className="font-bold text-gray-900">{score} / 15</span></p>
          <p className="text-lg font-bold mb-6">当前心理状态：<span className={tag === '健康' ? 'text-green-600' : tag === '亚健康' ? 'text-yellow-600' : 'text-red-600'}>{tag}</span></p>
          
          <div className="bg-gray-50 p-4 rounded-2xl text-left text-sm text-gray-600 mb-8 leading-relaxed">
            <p className="font-bold mb-1 text-gray-800">系统建议：</p>
            {tag === '健康' && "您的心态非常健康！建议继续保持良好的作息，多去操场晒晒太阳或听听欢快的音乐，享受美好的校园生活。"}
            {tag === '亚健康' && "您的心理状态目前处于亚健康水平，可能近期压力较大。建议适当给自己减减压，找朋友聊聊天，或者联系我们的在线咨询师进行一次简单的沟通。"}
            {tag === '不健康' && "您的测试分数较低，显示目前处于心理波动期。请不要独自承受，建议您立即联系所在学院的辅导员，或者预约专业心理咨询师进行深度的心理访谈。"}
          </div>

          <button 
            onClick={() => onComplete(tag, score)}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
          >
            完成并更新状态
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[250] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xl w-full animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">高校学生心理健康测评</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
        </div>

        <div className="w-full bg-gray-100 h-2 rounded-full mb-8 overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="min-h-[120px] mb-8">
          <p className="text-xs text-indigo-500 font-bold mb-2 uppercase tracking-widest">问题 {currentStep + 1} / {QUESTIONS.length}</p>
          <h3 className="text-lg font-bold text-gray-800 leading-snug">{QUESTIONS[currentStep]}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleAnswer(true)}
            className="group flex flex-col items-center p-6 bg-gray-50 hover:bg-green-50 rounded-2xl border-2 border-transparent hover:border-green-200 transition-all"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
              <i className="fas fa-check text-green-500"></i>
            </div>
            <span className="font-bold text-gray-600 group-hover:text-green-700">是 / 经常</span>
          </button>
          <button 
            onClick={() => handleAnswer(false)}
            className="group flex flex-col items-center p-6 bg-gray-50 hover:bg-red-50 rounded-2xl border-2 border-transparent hover:border-red-200 transition-all"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
              <i className="fas fa-times text-red-500"></i>
            </div>
            <span className="font-bold text-gray-600 group-hover:text-red-700">否 / 很少</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PsychologicalTest;
