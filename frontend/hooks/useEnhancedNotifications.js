"use client"
import { useEffect, useState, useCallback } from "react";
import axios from "../utils/axiosInstance";

export default function useEnhancedNotifications(pollInterval = 10000) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/notifications?limit=5");
      setNotifications(res.data.notifications || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get("/api/notifications/stats");
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, pollInterval);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount, pollInterval]);

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      await axios.put(`/api/notifications/${id}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (e) {
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  return { notifications, unreadCount, loading, markAsRead, refetch: fetchNotifications };
}
