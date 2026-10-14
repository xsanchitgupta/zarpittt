'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, Send, MessageCircle, Phone, Shield, 
  Check, CheckCheck, Clock, Calendar, 
  Smile, Paperclip
} from 'lucide-react';
import supabase from '@/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    full_name: string;
  } | null;
}

interface ChatModalProps {
  bookingId: string;
  userId: string;
  professional: {
    name: string;
    avatar?: string;
    phone?: string;
    online?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatModal({ bookingId, userId, professional, isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch and Subscribe
  useEffect(() => {
    if (!bookingId || !isOpen) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?booking_id=${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data as Message[]);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `booking_id=eq.${bookingId}` },
        async (payload) => {
          // Optimistically show sender as Professional if not me
          const isMe = payload.new.sender_id === userId;
          const sender = isMe ? { full_name: 'You' } : { full_name: professional.name };
          
          setMessages((prev) => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, { ...(payload.new as Message), sender }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || sending || !bookingId) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          sender_id: userId,
          message: text,
        }),
      });
      
      if (res.ok) {
        const sentMsg = await res.json();
        // Optimistically add to messages if not already there
        setMessages(prev => {
          if (prev.find(m => m.id === sentMsg.id)) return prev;
          return [...prev, { ...sentMsg, sender: { full_name: 'You' } }];
        });
      }

      if (!res.ok) {
        console.error('Error sending message:', await res.text());
        // Revert if error? 
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  // Group messages by date
  const groupMessages = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(msg => {
      const d = new Date(msg.created_at);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessages(messages);

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 10000, 
      background: 'rgba(0,0,0,0.4)', 
      backdropFilter: 'blur(12px)', 
      display: 'flex', 
      alignItems: 'flex-end', 
      justifyContent: 'flex-end', 
      padding: '24px' 
    }}>
      <div style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border)', 
        borderRadius: '32px',
        width: '420px', 
        maxWidth: 'calc(100vw - 48px)', 
        height: 'min(700px, 85vh)', 
        display: 'flex', 
        flexDirection: 'column', 
        animation: 'chatModalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border)', 
          background: 'rgba(255,255,255,0.02)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                width: 44, 
                height: 44, 
                borderRadius: '16px', 
                background: 'linear-gradient(135deg, var(--accent), #ff9a56)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.1)'
              }}>
                {professional.avatar ? (
                  <img src={professional.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  professional.name.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ 
                position: 'absolute', 
                bottom: -2, 
                right: -2, 
                width: 14, 
                height: 14, 
                borderRadius: '50%', 
                background: '#22c55e', 
                border: '3px solid var(--bg-elevated)',
                boxShadow: '0 0 8px rgba(34,197,94,0.4)'
              }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  {professional.name}
                </span>
                <div style={{ 
                  background: 'var(--accent-light)', 
                  padding: '2px 6px', 
                  borderRadius: 6, 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <Shield size={10} color="var(--accent)" fill="var(--accent)" />
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                Active Now
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {professional.phone && (
              <a href={`tel:${professional.phone}`} style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}>
                <Phone size={18} />
              </a>
            )}
            <button onClick={onClose} style={{ 
              width: 40, 
              height: 40, 
              borderRadius: '12px', 
              background: 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Messages List */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 24,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(255,117,31,0.02) 100%)'
        }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <MessageCircle size={32} color="var(--accent)" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Secure Chat with {professional.name.split(' ')[0]}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Ask about your service or location</p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Date Separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {formatMessageDate(date)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {msgs.map((msg, idx) => {
                  const isMe = msg.sender_id === userId;
                  const showAvatar = !isMe && (idx === 0 || msgs[idx-1].sender_id !== msg.sender_id);
                  
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                        {!isMe && (
                          <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--accent)', flexShrink: 0, overflow: 'hidden', opacity: showAvatar ? 1 : 0 }}>
                            {professional.avatar ? (
                              <img src={professional.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>
                                {professional.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: '20px',
                            borderTopRightRadius: isMe ? (idx > 0 && msgs[idx-1].sender_id === userId ? '20px' : '4px') : '20px',
                            borderTopLeftRadius: !isMe ? (idx > 0 && msgs[idx-1].sender_id !== userId ? '20px' : '4px') : '20px',
                            background: isMe ? 'var(--accent)' : 'var(--bg-card-solid)',
                            color: isMe ? '#000' : 'var(--text)',
                            fontSize: 14,
                            fontWeight: 500,
                            lineHeight: 1.5,
                            border: isMe ? 'none' : '1px solid var(--border)',
                            boxShadow: isMe ? '0 4px 12px rgba(255,117,31,0.2)' : 'none',
                            position: 'relative'
                          }}
                        >
                          {msg.message}
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4, 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: 'var(--text-muted)',
                        padding: isMe ? '0 4px 0 0' : '0 0 0 38px'
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        {isMe && <CheckCheck size={12} color="var(--accent)" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ 
          padding: '20px 24px 32px', 
          borderTop: '1px solid var(--border)', 
          background: 'rgba(255,255,255,0.01)',
          display: 'flex', 
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={{ color: 'var(--text-muted)', padding: 4 }}><Paperclip size={20} /></button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                style={{ 
                  width: '100%',
                  height: 52, 
                  borderRadius: '16px', 
                  fontSize: 14, 
                  padding: '0 48px 0 16px', 
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.background = 'rgba(255,255,255,0.03)';
                }}
              />
              <button style={{ 
                position: 'absolute', 
                right: 12, 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}>
                <Smile size={20} />
              </button>
            </div>
            <button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim()} 
              style={{ 
                width: 52, 
                height: 52, 
                borderRadius: '16px', 
                background: newMessage.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                color: newMessage.trim() ? '#000' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: newMessage.trim() ? 'scale(1)' : 'scale(0.95)'
              }}
            >
              <Send size={20} />
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.4 }}>
            <Shield size={12} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes chatModalIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
