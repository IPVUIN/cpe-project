"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // เพิ่มบรรทัดนี้
import { supabase } from "@/lib/supabaseClient"; 
import './Admin_Dashboard.css';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(value || 0);
};

export default function Admin_Dashboard() {
  const [isMounted, setIsMounted] = useState(false); // ไว้เช็คว่าโหลด Client เสร็จหรือยัง ป้องกัน Error ใน Next.js
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [dateFilter, setDateFilter] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [summaryData, setSummaryData] = useState({ totalTopUp: 0, totalSales: 0, activeUsers: 0, activeStores: 0 });
  const [storeSalesData, setStoreSalesData] = useState([]);
  
  const [topUpList, setTopUpList] = useState([]);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  const [user, setUser] = useState(null);

  const [aiInsights, setAiInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);

  // ตั้งค่า isMounted เมื่อ Component โหลดเสร็จ
  useEffect(() => {
    setIsMounted(true);
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", auth.user.id)
          .single();
        setUser(profile);
      }
    }
    loadUser()
  }, []);

  const getTargetDateRange = () => {
    const now = new Date();
    let start, end;

    if (dateFilter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      start = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 0, 0, 0).toISOString();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    } else if (dateFilter === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    } else if (dateFilter === 'custom') {
      if (customStartDate && customEndDate) {
        start = new Date(customStartDate + 'T00:00:00').toISOString();
        end = new Date(customEndDate + 'T23:59:59.999').toISOString();
      }
    }
    return { start, end };
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (dateFilter === 'custom' && (!customStartDate || !customEndDate)) return;

      setIsLoadingData(true);
      try {
        const { start, end } = getTargetDateRange();

        let topupsQuery = supabase.from('topups').select('id, amount, user_id, created_at').eq('status', 'success').order('created_at', { ascending: false });
        let ordersQuery = supabase.from('orders').select('id, user_id, total_price, created_at').eq('status', 'completed');

        if (start && end) {
          topupsQuery = topupsQuery.gte('created_at', start).lte('created_at', end);
          ordersQuery = ordersQuery.gte('created_at', start).lte('created_at', end);
        }

        const [ { data: topups, error: topupErr }, { data: orders, error: orderErr } ] = await Promise.all([
          topupsQuery,
          ordersQuery
        ]);

        if (topupErr) console.error("Topups Error:", topupErr.message);
        else setTopUpList(topups || []);

        if (orderErr) console.error("Orders Error:", orderErr.message);

        const orderDateLookup = {};
        orders?.forEach(o => { orderDateLookup[o.id] = o.created_at; });

        const { data: categories, error: catErr } = await supabase.from('store_category').select('id, name');
        if (catErr) console.error("Category Error:", catErr.message);
        const categoryMap = {};
        categories?.forEach(cat => { categoryMap[cat.id] = cat.name; });

        const { data: stores, error: storeErr } = await supabase.from('stores').select('*').eq('is_active', true);
        if (storeErr) console.error("Stores Error:", storeErr.message);

        let orderStores = [];
        if (orders && orders.length > 0) {
          const validOrderIds = orders.map(o => o.id);
          const { data: osData, error: osErr } = await supabase
            .from('order_stores')
            .select('id, order_id, store_id, store_total')
            .eq('status', 'finished')
            .in('order_id', validOrderIds);

          if (osErr) console.error("Order Stores Error:", osErr.message);
          orderStores = osData || [];
        }

        const totalTopUp = topups?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const totalSales = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
        const uniqueUsers = new Set(orders?.map(o => o.user_id));
        
        setSummaryData({
          totalTopUp,
          totalSales,
          activeUsers: uniqueUsers.size,
          activeStores: stores?.length || 0
        });

        const storeMap = {};
        
        stores?.forEach(store => {
          storeMap[store.id] = {
            id: store.id,
            name: store.name || 'ไม่ทราบชื่อร้าน',
            category: categoryMap[store.store_category] || 'อื่นๆ',
            sales: 0,
            orders: 0,
            orderHistory: []
          };
        });

        orderStores?.forEach(os => {
          const sId = os.store_id;
          if (storeMap[sId]) {
            storeMap[sId].sales += Number(os.store_total || 0);
            storeMap[sId].orders += 1;
            storeMap[sId].orderHistory.push({
              os_id: os.id,
              order_id: os.order_id,
              amount: Number(os.store_total || 0),
              created_at: orderDateLookup[os.order_id]
            });
          }
        });

        const storeSalesArray = Object.values(storeMap).map(store => {
          store.orderHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          return store;
        }).sort((a, b) => b.sales - a.sales);
        
        setStoreSalesData(storeSalesArray);

      } catch (error) {
        console.error("Fetch Data Execution Error:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [dateFilter, customStartDate, customEndDate]);


  const filteredStores = storeSalesData.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    store.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (!user) return <div>กำลังโหลด...</div>;
  if (user.role !== "admin") return <div>ไม่มีสิทธิ์</div>;

  return (
    <div className="admin-layout">
      {/* ========================================= */}
      {/* Modal 1: แสดงตารางเติมเงิน (ใช้ createPortal) */}
      {/* ========================================= */}
      {isMounted && isTopUpModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsTopUpModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>รายการเติมเงินที่สำเร็จ (Success)</h3>
              <button className="close-btn" onClick={() => setIsTopUpModalOpen(false)}>✖</button>
            </div>
            <div className="modal-body">
              {topUpList.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>วันที่-เวลา</th>
                      <th>รหัสผู้ใช้ (User ID)</th>
                      <th style={{ textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUpList.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{new Date(item.created_at).toLocaleString('th-TH')}</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.user_id}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  ไม่พบรายการเติมเงินในช่วงเวลานี้
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================= */}
      {/* Modal 2: แสดงออเดอร์ของร้านที่เลือก (ใช้ createPortal) */}
      {/* ========================================= */}
      {isMounted && selectedStore && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedStore(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>ประวัติออเดอร์: {selectedStore.name}</h3>
                <span className="store-category" style={{ marginTop: 0 }}>{selectedStore.category}</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedStore(null)}>✖</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>จำนวนออเดอร์ทั้งหมด</p>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{selectedStore.orderHistory.length} รายการ</h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>ยอดขายรวม</p>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#16a34a' }}>{formatCurrency(selectedStore.sales)}</h4>
                </div>
              </div>

              {selectedStore.orderHistory.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID หลัก</th>
                      <th>เวลาที่สั่งซื้อ</th>
                      <th style={{ textAlign: 'right' }}>ยอดชำระร้านนี้</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStore.orderHistory.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ color: '#4f46e5', fontWeight: '500' }}>#{item.order_id}</td>
                        <td>{item.created_at ? new Date(item.created_at).toLocaleString('th-TH') : '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  ยังไม่มีออเดอร์ในช่วงเวลานี้
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h2 className="header-title">รายงานภาพรวมศูนย์อาหาร</h2>
          </div>
        </header>

        <div className="admin-content">
          
          <div className="date-filter-container">
            <div className="date-filter-buttons">
              <button 
                className={`filter-btn ${dateFilter === 'today' ? 'active' : ''}`} 
                onClick={() => setDateFilter('today')}
              >
                วันนี้
              </button>
              <button 
                className={`filter-btn ${dateFilter === '7days' ? 'active' : ''}`} 
                onClick={() => setDateFilter('7days')}
              >
                7 วันล่าสุด
              </button>
              <button 
                className={`filter-btn ${dateFilter === 'month' ? 'active' : ''}`} 
                onClick={() => setDateFilter('month')}
              >
                เดือน
              </button>
            </div>

            <div className="custom-date-section">
              <span className="custom-date-label">กำหนดช่วง</span>
              <div className="custom-date-inputs">
                <input 
                  type="date" 
                  className="date-input"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setDateFilter('custom');
                  }}
                />
                <span>-</span>
                <input 
                  type="date" 
                  className="date-input"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setDateFilter('custom');
                  }}
                />
              </div>
            </div>
          </div>

          {isLoadingData ? (
            <div className="loading-screen" style={{ height: '400px' }}>
              <span className="spin" style={{ fontSize: '2.5rem' }}>⏳</span>
              <p className="loading-text">กำลังโหลดข้อมูลช่วงเวลานี้...</p>
            </div>
          ) : (
            <>
              <div className="kpi-grid">
                <div className="kpi-card clickable-card" onClick={() => setIsTopUpModalOpen(true)} title="คลิกเพื่อดูรายละเอียด">
                  <div>
                    <p className="kpi-title">ยอดเติมเงินรวม (Success)</p>
                    <h3 className="kpi-value text-blue-600">{formatCurrency(summaryData.totalTopUp)}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.5rem', marginBottom: 0 }}>👉 คลิกดูรายการ</p>
                  </div>
                  <div className="kpi-icon icon-blue">💳</div>
                </div>
                <div className="kpi-card">
                  <div>
                    <p className="kpi-title">ยอดขายรวมทุกร้าน</p>
                    <h3 className="kpi-value">{formatCurrency(summaryData.totalSales)}</h3>
                  </div>
                  <div className="kpi-icon icon-green">💰</div>
                </div>
                <div className="kpi-card">
                  <div>
                    <p className="kpi-title">ผู้ใช้บริการ</p>
                    <h3 className="kpi-value">{summaryData.activeUsers.toLocaleString()} คน</h3>
                  </div>
                  <div className="kpi-icon icon-purple">👥</div>
                </div>
                <div className="kpi-card">
                  <div>
                    <p className="kpi-title">ร้านค้าที่เปิดบริการ</p>
                    <h3 className="kpi-value">{summaryData.activeStores} ร้าน</h3>
                  </div>
                  <div className="kpi-icon icon-yellow">🏪</div>
                </div>
              </div>

              <div className="store-section">
                <div className="store-header-row">
                  <div> 
                    <h3 className="store-section-title">รายละเอียดยอดขายรายร้านค้า</h3>
                  </div>
                  <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="ค้นหาผ่านชื่อร้านหรือหมวดหมู่..."
                      className="search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {filteredStores.length === 0 ? (
                  <div className="empty-state">
                    <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>📂</p>
                    <p style={{ margin: 0 }}>ไม่พบร้านค้าที่คุณค้นหา</p>
                  </div>
                ) : (
                  <div className="store-cards-grid">
                    {filteredStores.map((store, index) => {
                      const percentage = summaryData.totalSales > 0 ? ((store.sales / summaryData.totalSales) * 100).toFixed(1) : 0;
                      const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
                      
                      return (
                        <div 
                          key={store.id} 
                          className="store-card clickable-card" 
                          onClick={() => setSelectedStore(store)}
                        >
                          <div className="store-card-header">
                            <div>
                              <h4 className="store-name">{store.name}</h4>
                              <span className="store-category">{store.category}</span>
                            </div>
                            <span className={`store-rank ${rankClass}`}>{index + 1}</span>
                          </div>
                          
                          <div className="store-stats">
                            <div className="stat-group">
                              <p className="stat-label"><span>🛍️</span> {store.orders} ออเดอร์</p>
                              <p className="stat-value">{formatCurrency(store.sales)}</p>
                            </div>
                            <div className="stat-group" style={{ alignItems: 'flex-end' }}>
                              <p className="stat-label">สัดส่วนยอดขาย</p>
                              <p className="stat-percent">{percentage}%</p>
                            </div>
                          </div>
                          <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: '0.5rem', paddingTop: '0.75rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: '500' }}>👉 คลิกร้านนี้เพื่อดูออเดอร์</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
          
        </div>
      </main>
    </div>
  );
}