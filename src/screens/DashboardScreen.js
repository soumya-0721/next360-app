import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../utils/theme';
import { getData, setData, todayKey } from '../utils/storage';
import {
  DEFAULT_USERS,
  BIRTHDAYS_MAP,
  daysUntilBirthday,
  getGreeting,
  getRoleBadgeColor,
  getInitials,
  formatTimeFull,
  formatDateLong,
} from '../utils/data';
import {
  StatCard,
  Badge,
  Card,
  PrimaryButton,
  DangerButton,
  SectionHeader,
  EmptyState,
} from '../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  'Today',
  'Monthly',
  'Leave',
  'Updates',
  'Approvals',
  'Profile',
  'Charts',
  'Birthdays',
  'Chat',
  'Team',
  'Reviews',
  'Payroll',
  'Settings',
  'Selfies',
];

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Unpaid Leave'];
const TASK_STATUSES = ['In Progress', 'Completed', 'Blocked', 'Pending'];

const isCEO = (role) => role === 'CEO' || role === 'CTO';

function getBarWidth(value, max) {
  if (!max) return 0;
  return Math.max((value / max) * 100, 2);
}

function MiniBarChart({ data, maxValue }) {
  return (
    <View style={chartStyles.barContainer}>
      {data.map((item, idx) => (
        <View key={idx} style={chartStyles.barColumn}>
          <Text style={chartStyles.barValue}>{item.value}</Text>
          <View style={[chartStyles.bar, { height: getBarWidth(item.value, maxValue || 1) }]} />
          <Text style={chartStyles.barLabel} numberOfLines={1}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState({ leaves: [], expenses: [], documents: [] });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [allUsers, setAllUsers] = useState(DEFAULT_USERS);
  const [editingUser, setEditingUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifCount, setNotifCount] = useState(3);

  const [leaveForm, setLeaveForm] = useState({ date: todayKey(), type: 'Sick Leave', reason: '' });
  const [taskForm, setTaskForm] = useState({ title: '', planned: '', completed: '', blockers: '', status: 'In Progress' });
  const [approvalTab, setApprovalTab] = useState('leaves');

  const tabScrollRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const att = await getData('attendance') || {};
      const lv = await getData('leaves') || [];
      const tk = await getData('tasks') || [];
      const ap = await getData('approvals') || { leaves: [], expenses: [], documents: [] };
      const ch = await getData('chatMessages') || [];
      const us = await getData('allUsers') || DEFAULT_USERS;
      setAttendance(att);
      setLeaves(lv);
      setTasks(tk);
      setApprovals(ap);
      setChatMessages(ch);
      setAllUsers(us);
    } catch (e) {
      console.log('Load data error:', e);
    }
  };

  const saveData = async (key, value) => {
    try {
      await setData(key, value);
    } catch (e) {
      console.log('Save data error:', e);
    }
  };

  const todayRecords = attendance[todayKey()] || {};

  const presentCount = Object.values(todayRecords).filter((r) => r.status === 'Present').length;
  const absentCount = Object.values(todayRecords).filter((r) => r.status === 'Absent').length;
  const sickThisMonth = leaves.filter(
    (l) => l.type === 'Sick Leave' && l.date && l.date.startsWith(new Date().toISOString().slice(0, 7))
  ).length;
  const casualThisMonth = leaves.filter(
    (l) => l.type === 'Casual Leave' && l.date && l.date.startsWith(new Date().toISOString().slice(0, 7))
  ).length;

  const handleCheckIn = () => {
    const key = todayKey();
    const updated = { ...attendance };
    if (!updated[key]) updated[key] = {};
    updated[key][user.email] = {
      ...updated[key][user.email],
      checkIn: formatTimeFull(new Date()),
      status: 'Present',
      name: user.name,
      email: user.email,
    };
    setAttendance(updated);
    saveData('attendance', updated);
    Alert.alert('Checked In', 'Your attendance has been marked.');
  };

  const handleCheckOut = () => {
    const key = todayKey();
    const updated = { ...attendance };
    if (!updated[key]) updated[key] = {};
    updated[key][user.email] = {
      ...updated[key][user.email],
      checkOut: formatTimeFull(new Date()),
    };
    setAttendance(updated);
    saveData('attendance', updated);
    Alert.alert('Checked Out', 'Your check-out has been recorded.');
  };

  const handleMarkLeave = () => {
    if (!leaveForm.reason.trim()) {
      Alert.alert('Error', 'Please enter a reason.');
      return;
    }
    const newLeave = {
      id: Date.now().toString(),
      email: user.email,
      name: user.name,
      date: leaveForm.date,
      type: leaveForm.type,
      reason: leaveForm.reason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    const updated = [...leaves, newLeave];
    setLeaves(updated);
    saveData('leaves', updated);
    setLeaveForm({ date: todayKey(), type: 'Sick Leave', reason: '' });
    Alert.alert('Leave Submitted', 'Your leave request has been sent for approval.');
  };

  const handleSubmitTask = () => {
    if (!taskForm.title.trim()) {
      Alert.alert('Error', 'Please enter a task title.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      email: user.email,
      name: user.name,
      ...taskForm,
      date: todayKey(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveData('tasks', updated);
    setTaskForm({ title: '', planned: '', completed: '', blockers: '', status: 'In Progress' });
    Alert.alert('Task Submitted', 'Your work update has been saved.');
  };

  const handleApprove = (type, id, approved) => {
    const updated = { ...approvals };
    const list = updated[type] || [];
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx].status = approved ? 'Approved' : 'Rejected';
      list[idx].approvedBy = user.name;
      list[idx].approvedAt = new Date().toISOString();
    }
    updated[type] = list;
    setApprovals(updated);
    saveData('approvals', updated);
  };

  const handleAdminMarkAttendance = (email, status) => {
    const key = todayKey();
    const updated = { ...attendance };
    if (!updated[key]) updated[key] = {};
    updated[key][email] = {
      ...updated[key][email],
      status,
      name: allUsers.find((u) => u.email === email)?.name || email,
      email,
      markedBy: user.name,
    };
    setAttendance(updated);
    saveData('attendance', updated);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now().toString(),
      email: user.email,
      name: user.name,
      message: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    saveData('chatMessages', updated);
    setChatInput('');
  };

  const handleUpdateUser = (u) => {
    const updated = allUsers.map((usr) => (usr.email === u.email ? { ...usr, ...u } : usr));
    setAllUsers(updated);
    saveData('allUsers', updated);
    setEditingUser(null);
    setModalVisible(false);
  };

  const handleDeleteUser = (email) => {
    Alert.alert('Delete User', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = allUsers.filter((u) => u.email !== email);
          setAllUsers(updated);
          saveData('allUsers', updated);
        },
      },
    ]);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyAttendance = {};
  Object.keys(attendance).forEach((date) => {
    if (date.startsWith(currentMonth)) {
      const dayRecs = attendance[date];
      Object.entries(dayRecs).forEach(([email, rec]) => {
        if (!monthlyAttendance[email]) {
          monthlyAttendance[email] = { name: rec.name || email, present: 0, absent: 0, leaves: 0, total: 0 };
        }
        monthlyAttendance[email].total++;
        if (rec.status === 'Present') monthlyAttendance[email].present++;
        else if (rec.status === 'Absent') monthlyAttendance[email].absent++;
      });
    }
  });
  leaves.forEach((l) => {
    if (l.date && l.date.startsWith(currentMonth) && l.status === 'Approved' && monthlyAttendance[l.email]) {
      monthlyAttendance[l.email].leaves++;
    }
  });

  const myLeaves = leaves.filter((l) => l.email === user.email);
  const myTasks = tasks.filter((t) => t.email === user.email);

  const upcomingBirthdays = BIRTHDAYS_MAP.map((b) => {
    const days = daysUntilBirthday(b.month, b.day);
    return { name: b.name, days, month: b.month, day: b.day };
  }).sort((a, b) => a.days - b.days);

  const payrollData = allUsers.map((u) => {
    const monthLeaves = leaves.filter(
      (l) => l.email === u.email && l.date && l.date.startsWith(currentMonth) && l.status === 'Approved'
    ).length;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const workingDays = daysInMonth - Math.floor(daysInMonth / 7) * 2;
    const baseSalary = u.salary || 30000;
    const perDay = baseSalary / workingDays;
    const deduction = perDay * monthLeaves;
    const net = baseSalary - deduction;
    return { ...u, monthLeaves, workingDays, baseSalary, deduction, net };
  });

  const chartData = allUsers.map((u) => {
    const rec = monthlyAttendance[u.email] || { present: 0 };
    return { label: (u.name || '').split(' ')[0], value: rec.present };
  });
  const chartMax = Math.max(...chartData.map((d) => d.value), 1);

  const leaveChartData = LEAVE_TYPES.map((type) => ({
    label: type.split(' ')[0],
    value: leaves.filter((l) => l.type === type && l.date && l.date.startsWith(currentMonth)).length,
  }));
  const leaveChartMax = Math.max(...leaveChartData.map((d) => d.value), 1);

  const pendingApprovals = [
    ...approvals.leaves.filter((a) => a.status === 'Pending'),
    ...approvals.expenses.filter((a) => a.status === 'Pending'),
    ...approvals.documents.filter((a) => a.status === 'Pending'),
  ];

  const greeting = getGreeting();

  const renderTabBar = () => (
    <View style={styles.tabBarWrapper}>
      <ScrollView
        ref={tabScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {TABS.map((tab, idx) => {
          const CEOOnly = ['Team', 'Reviews', 'Payroll', 'Settings', 'Selfies'].includes(tab);
          if (CEOOnly && !isCEO(user.role)) return null;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === idx && styles.tabActive]}
              onPress={() => setActiveTab(idx)}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{tab}</Text>
              {tab === 'Approvals' && pendingApprovals.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{pendingApprovals.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <View>
          <Text style={styles.companyName}>Next360</Text>
          <Text style={styles.companySub}>Office Attendance</Text>
        </View>
      </View>
      <View style={styles.topBarCenter}>
        <Text style={styles.clockTime}>{formatTimeFull(currentTime)}</Text>
        <Text style={styles.clockDate}>{formatDateLong(currentTime)}</Text>
      </View>
      <View style={styles.topBarRight}>
        <TouchableOpacity style={styles.notifButton} onPress={() => setNotifCount(0)}>
          <Text style={styles.notifIcon}>🔔</Text>
          {notifCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
          <Badge text={user.role} color={getRoleBadgeColor(user.role)} />
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWelcomeBanner = () => (
    <View style={styles.welcomeBanner}>
      <View style={styles.welcomeLeft}>
        <Text style={styles.welcomeGreeting}>{greeting}, {user.name?.split(' ')[0]}!</Text>
        <Text style={styles.welcomeOffice}>Office Hours: 10:00 AM - 7:00 PM</Text>
        <Text style={styles.welcomeDay}>{formatDateLong(new Date())}</Text>
      </View>
      <View style={styles.welcomeClock}>
        <Text style={styles.welcomeClockTime}>{formatTimeFull(currentTime)}</Text>
      </View>
    </View>
  );

  const renderStatCards = () => (
    <View style={styles.statRow}>
      <StatCard title="Present Today" value={presentCount} color={COLORS.success || '#27ae60'} />
      <StatCard title="Absent Today" value={absentCount} color={COLORS.danger || '#e74c3c'} />
      <StatCard title="Sick Leave" value={sickThisMonth} color={COLORS.warning || '#f39c12'} />
      <StatCard title="Casual Leave" value={casualThisMonth} color={COLORS.info || '#3498db'} />
    </View>
  );

  const renderCheckButtons = () => (
    <View style={styles.checkRow}>
      <PrimaryButton title="✓ Check In" onPress={handleCheckIn} style={styles.checkBtn} />
      <DangerButton title="✕ Check Out" onPress={handleCheckOut} style={styles.checkBtn} />
    </View>
  );

  const renderTodayTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      {renderWelcomeBanner()}
      {renderStatCards()}
      {renderCheckButtons()}
      <Card>
        <SectionHeader title="Today's Attendance" />
        {Object.keys(todayRecords).length === 0 ? (
          <EmptyState message="No attendance records for today." />
        ) : (
          Object.entries(todayRecords).map(([email, rec]) => (
            <View key={email} style={styles.attRow}>
              <View style={styles.attAvatar}>
                <Text style={styles.attAvatarText}>{getInitials(rec.name || email)}</Text>
              </View>
              <View style={styles.attInfo}>
                <Text style={styles.attName}>{rec.name || email}</Text>
                <Text style={styles.attTime}>
                  In: {rec.checkIn || '--:--'} | Out: {rec.checkOut || '--:--'}
                </Text>
              </View>
              <Badge
                text={rec.status || 'N/A'}
                color={rec.status === 'Present' ? COLORS.success : rec.status === 'Absent' ? COLORS.danger : COLORS.gray}
              />
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderMonthlyTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title={`Monthly Attendance - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`} />
        {Object.keys(monthlyAttendance).length === 0 ? (
          <EmptyState message="No attendance data for this month." />
        ) : (
          Object.entries(monthlyAttendance).map(([email, data]) => {
            const rate = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
            return (
              <View key={email} style={styles.monthlyRow}>
                <Text style={styles.monthlyName}>{data.name}</Text>
                <View style={styles.monthlyStats}>
                  <Text style={styles.monthlyStat}>P:{data.present}</Text>
                  <Text style={styles.monthlyStat}>A:{data.absent}</Text>
                  <Text style={styles.monthlyStat}>L:{data.leaves}</Text>
                  <Text style={[styles.monthlyStat, { color: rate >= 80 ? COLORS.success : COLORS.danger }]}>{rate}%</Text>
                </View>
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
  );

  const renderLeaveTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title="Mark Leave" />
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={leaveForm.date}
          onChangeText={(t) => setLeaveForm({ ...leaveForm, date: t })}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.label}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
          {LEAVE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, leaveForm.type === type && styles.typeChipActive]}
              onPress={() => setLeaveForm({ ...leaveForm, type })}
            >
              <Text style={[styles.typeChipText, leaveForm.type === type && styles.typeChipTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.label}>Reason</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={leaveForm.reason}
          onChangeText={(t) => setLeaveForm({ ...leaveForm, reason: t })}
          placeholder="Enter reason..."
          multiline
          numberOfLines={3}
        />
        <PrimaryButton title="Submit Leave" onPress={handleMarkLeave} />
      </Card>
      <Card>
        <SectionHeader title="My Leaves" />
        {myLeaves.length === 0 ? (
          <EmptyState message="No leave records." />
        ) : (
          myLeaves.slice().reverse().map((l) => (
            <View key={l.id} style={styles.leaveRow}>
              <View style={styles.leaveInfo}>
                <Text style={styles.leaveType}>{l.type}</Text>
                <Text style={styles.leaveDate}>{l.date}</Text>
                <Text style={styles.leaveReason}>{l.reason}</Text>
              </View>
              <Badge
                text={l.status}
                color={l.status === 'Approved' ? COLORS.success : l.status === 'Rejected' ? COLORS.danger : COLORS.warning}
              />
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderUpdatesTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title="Add Work Update" />
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={taskForm.title}
          onChangeText={(t) => setTaskForm({ ...taskForm, title: t })}
          placeholder="Task title"
        />
        <Text style={styles.label}>Planned</Text>
        <TextInput
          style={styles.input}
          value={taskForm.planned}
          onChangeText={(t) => setTaskForm({ ...taskForm, planned: t })}
          placeholder="What was planned"
        />
        <Text style={styles.label}>Completed</Text>
        <TextInput
          style={styles.input}
          value={taskForm.completed}
          onChangeText={(t) => setTaskForm({ ...taskForm, completed: t })}
          placeholder="What was completed"
        />
        <Text style={styles.label}>Blockers</Text>
        <TextInput
          style={styles.input}
          value={taskForm.blockers}
          onChangeText={(t) => setTaskForm({ ...taskForm, blockers: t })}
          placeholder="Any blockers"
        />
        <Text style={styles.label}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
          {TASK_STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.typeChip, taskForm.status === s && styles.typeChipActive]}
              onPress={() => setTaskForm({ ...taskForm, status: s })}
            >
              <Text style={[styles.typeChipText, taskForm.status === s && styles.typeChipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <PrimaryButton title="Submit Update" onPress={handleSubmitTask} />
      </Card>
      <Card>
        <SectionHeader title="My Work Updates" />
        {myTasks.length === 0 ? (
          <EmptyState message="No work updates yet." />
        ) : (
          myTasks.slice().reverse().map((t) => (
            <View key={t.id} style={styles.taskRow}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <Badge
                  text={t.status}
                  color={
                    t.status === 'Completed' ? COLORS.success :
                    t.status === 'Blocked' ? COLORS.danger :
                    t.status === 'In Progress' ? COLORS.info : COLORS.gray
                  }
                />
              </View>
              <Text style={styles.taskDate}>{t.date}</Text>
              {t.planned ? <Text style={styles.taskDetail}>Planned: {t.planned}</Text> : null}
              {t.completed ? <Text style={styles.taskDetail}>Completed: {t.completed}</Text> : null}
              {t.blockers ? <Text style={[styles.taskDetail, { color: COLORS.danger }]}>Blockers: {t.blockers}</Text> : null}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderApprovalsTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <View style={styles.approvalTabRow}>
        {['leaves', 'expenses', 'documents'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.approvalTab, approvalTab === tab && styles.approvalTabActive]}
            onPress={() => setApprovalTab(tab)}
          >
            <Text style={[styles.approvalTabText, approvalTab === tab && styles.approvalTabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Card>
        <SectionHeader title={`Pending ${approvalTab.charAt(0).toUpperCase() + approvalTab.slice(1)}`} />
        {(approvals[approvalTab] || []).length === 0 ? (
          <EmptyState message={`No pending ${approvalTab}.`} />
        ) : (
          (approvals[approvalTab] || []).map((a) => (
            <View key={a.id} style={styles.approvalRow}>
              <View style={styles.approvalInfo}>
                <Text style={styles.approvalName}>{a.name || a.email}</Text>
                <Text style={styles.approvalDetail}>{a.type || a.title || a.category || ''}</Text>
                <Text style={styles.approvalDetail}>{a.date || a.amount ? `Amount: ${a.amount}` : ''}</Text>
                <Text style={styles.approvalDetail}>{a.reason || a.description || ''}</Text>
              </View>
              {a.status === 'Pending' && isCEO(user.role) && (
                <View style={styles.approvalActions}>
                  <TouchableOpacity
                    style={[styles.approveBtn]}
                    onPress={() => handleApprove(approvalTab, a.id, true)}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn]}
                    onPress={() => handleApprove(approvalTab, a.id, false)}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
              {a.status !== 'Pending' && (
                <Badge
                  text={a.status}
                  color={a.status === 'Approved' ? COLORS.success : COLORS.danger}
                />
              )}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{getInitials(user.name)}</Text>
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Badge text={user.role} color={getRoleBadgeColor(user.role)} />
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
      </Card>
      <Card>
        <SectionHeader title="My Statistics" />
        <View style={styles.profileStats}>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{myLeaves.length}</Text>
            <Text style={styles.profileStatLabel}>Total Leaves</Text>
          </View>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>{myTasks.length}</Text>
            <Text style={styles.profileStatLabel}>Work Updates</Text>
          </View>
          <View style={styles.profileStatItem}>
            <Text style={styles.profileStatValue}>
              {(monthlyAttendance[user.email]?.present || 0)}
            </Text>
            <Text style={styles.profileStatLabel}>Days Present</Text>
          </View>
        </View>
      </Card>
      <Card>
        <SectionHeader title="Recent Leaves" />
        {myLeaves.slice(-3).reverse().map((l) => (
          <View key={l.id} style={styles.leaveRow}>
            <View style={styles.leaveInfo}>
              <Text style={styles.leaveType}>{l.type} - {l.date}</Text>
              <Text style={styles.leaveReason}>{l.reason}</Text>
            </View>
            <Badge text={l.status} color={l.status === 'Approved' ? COLORS.success : l.status === 'Rejected' ? COLORS.danger : COLORS.warning} />
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderChartsTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title="Monthly Attendance Chart" />
        {chartData.length === 0 ? (
          <EmptyState message="No data available." />
        ) : (
          <MiniBarChart data={chartData} maxValue={chartMax} />
        )}
      </Card>
      <Card>
        <SectionHeader title="Leave Distribution" />
        <MiniBarChart data={leaveChartData} maxValue={leaveChartMax} />
      </Card>
    </ScrollView>
  );

  const renderBirthdaysTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title="Upcoming Birthdays" />
        {upcomingBirthdays.length === 0 ? (
          <EmptyState message="No upcoming birthdays." />
        ) : (
          upcomingBirthdays.map((b, idx) => (
            <View key={idx} style={styles.birthdayRow}>
              <View style={styles.birthdayAvatar}>
                <Text style={styles.birthdayEmoji}>🎂</Text>
              </View>
              <View style={styles.birthdayInfo}>
                <Text style={styles.birthdayName}>{b.name}</Text>
                <Text style={styles.birthdayDate}>{new Date(new Date().getFullYear(), b.month - 1, b.day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
              </View>
              <View style={styles.birthdayCountdown}>
                <Text style={styles.birthdayDays}>{b.days}</Text>
                <Text style={styles.birthdayDaysLabel}>{b.days === 0 ? 'Today!' : 'days'}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderChatTab = () => (
    <View style={styles.chatContainer}>
      <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent}>
        {chatMessages.length === 0 ? (
          <EmptyState message="No messages yet. Start the conversation!" />
        ) : (
          chatMessages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.chatMsg, msg.email === user.email ? styles.chatMsgOwn : styles.chatMsgOther]}
            >
              <Text style={styles.chatMsgName}>{msg.name}</Text>
              <Text style={styles.chatMsgText}>{msg.message}</Text>
              <Text style={styles.chatMsgTime}>{new Date(msg.timestamp).toLocaleTimeString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.chatInputRow}>
        <TextInput
          style={styles.chatInput}
          value={chatInput}
          onChangeText={setChatInput}
          placeholder="Type a message..."
        />
        <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChat}>
          <Text style={styles.chatSendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTeamTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title="Team Attendance Management" />
        {allUsers.map((u) => {
          const rec = todayRecords[u.email] || {};
          return (
            <View key={u.email} style={styles.teamRow}>
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>{getInitials(u.name)}</Text>
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{u.name}</Text>
                <Text style={styles.teamRole}>{u.role} | {rec.checkIn ? `In: ${rec.checkIn}` : 'Not checked in'}</Text>
              </View>
              <View style={styles.teamActions}>
                <TouchableOpacity
                  style={[styles.markBtn, rec.status === 'Present' && styles.markBtnActive]}
                  onPress={() => handleAdminMarkAttendance(u.email, 'Present')}
                >
                  <Text style={styles.markBtnText}>P</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.markBtn, styles.markBtnAbsent, rec.status === 'Absent' && styles.markBtnActive]}
                  onPress={() => handleAdminMarkAttendance(u.email, 'Absent')}
                >
                  <Text style={styles.markBtnText}>A</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );

  const renderReviewsTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title="Team Work Updates" />
        {tasks.length === 0 ? (
          <EmptyState message="No work updates submitted." />
        ) : (
          tasks.slice().reverse().map((t) => (
            <View key={t.id} style={styles.reviewRow}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewName}>{t.name}</Text>
                <Badge
                  text={t.status}
                  color={t.status === 'Completed' ? COLORS.success : t.status === 'Blocked' ? COLORS.danger : COLORS.info}
                />
              </View>
              <Text style={styles.reviewTitle}>{t.title}</Text>
              <Text style={styles.reviewDetail}>Date: {t.date}</Text>
              {t.planned ? <Text style={styles.reviewDetail}>Planned: {t.planned}</Text> : null}
              {t.completed ? <Text style={styles.reviewDetail}>Completed: {t.completed}</Text> : null}
              {t.blockers ? <Text style={[styles.reviewDetail, { color: COLORS.danger }]}>Blockers: {t.blockers}</Text> : null}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderPayrollTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title="Monthly Payroll" />
        {payrollData.length === 0 ? (
          <EmptyState message="No payroll data." />
        ) : (
          payrollData.map((p) => (
            <View key={p.email} style={styles.payrollRow}>
              <View style={styles.payrollInfo}>
                <Text style={styles.payrollName}>{p.name}</Text>
                <Text style={styles.payrollRole}>{p.role}</Text>
              </View>
              <View style={styles.payrollAmounts}>
                <Text style={styles.payrollBase}>Base: ₹{p.baseSalary.toLocaleString()}</Text>
                <Text style={styles.payrollDeduction}>Leaves: {p.monthLeaves} | Ded: -₹{Math.round(p.deduction).toLocaleString()}</Text>
                <Text style={styles.payrollNet}>Net: ₹{Math.round(p.net).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <SectionHeader title="Manage Team Profiles" />
      <View style={styles.settingsGrid}>
        {allUsers.map((u) => (
          <TouchableOpacity
            key={u.email}
            style={styles.settingsCard}
            onPress={() => { setEditingUser({ ...u }); setModalVisible(true); }}
            onLongPress={() => handleDeleteUser(u.email)}
          >
            <View style={styles.settingsAvatar}>
              <Text style={styles.settingsAvatarText}>{getInitials(u.name)}</Text>
            </View>
            <Text style={styles.settingsName} numberOfLines={1}>{u.name}</Text>
            <Badge text={u.role} color={getRoleBadgeColor(u.role)} />
            <Text style={styles.settingsEmail} numberOfLines={1}>{u.email}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          {editingUser && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editingUser.name}
                onChangeText={(t) => setEditingUser({ ...editingUser, name: t })}
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editingUser.email}
                onChangeText={(t) => setEditingUser({ ...editingUser, email: t })}
              />
              <Text style={styles.label}>Role</Text>
              <TextInput
                style={styles.input}
                value={editingUser.role}
                onChangeText={(t) => setEditingUser({ ...editingUser, role: t })}
              />
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editingUser.phone || ''}
                onChangeText={(t) => setEditingUser({ ...editingUser, phone: t })}
              />
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                value={editingUser.department || ''}
                onChangeText={(t) => setEditingUser({ ...editingUser, department: t })}
              />
              <Text style={styles.label}>Salary</Text>
              <TextInput
                style={styles.input}
                value={String(editingUser.salary || '')}
                onChangeText={(t) => setEditingUser({ ...editingUser, salary: Number(t) || 0 })}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <PrimaryButton title="Save" onPress={() => handleUpdateUser(editingUser)} />
                <DangerButton title="Cancel" onPress={() => { setModalVisible(false); setEditingUser(null); }} />
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </ScrollView>
  );

  const renderSelfiesTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentContainer}>
      <Card>
        <SectionHeader title="Login/Logout Selfies" />
        <Text style={styles.selfieNote}>
          Selfie capture is active for all check-ins and check-outs. Photos are stored securely for admin review.
        </Text>
        {allUsers.map((u) => (
          <View key={u.email} style={styles.selfieRow}>
            <View style={styles.selfieAvatar}>
              <Text style={styles.selfieAvatarText}>{getInitials(u.name)}</Text>
            </View>
            <View style={styles.selfieInfo}>
              <Text style={styles.selfieName}>{u.name}</Text>
              <Text style={styles.selfieDetail}>Last selfie: {todayRecords[u.email]?.checkIn || 'N/A'}</Text>
            </View>
            <TouchableOpacity style={styles.selfieViewBtn}>
              <Text style={styles.selfieViewText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return renderTodayTab();
      case 1: return renderMonthlyTab();
      case 2: return renderLeaveTab();
      case 3: return renderUpdatesTab();
      case 4: return renderApprovalsTab();
      case 5: return renderProfileTab();
      case 6: return renderChartsTab();
      case 7: return renderBirthdaysTab();
      case 8: return renderChatTab();
      case 9: return isCEO(user.role) ? renderTeamTab() : null;
      case 10: return isCEO(user.role) ? renderReviewsTab() : null;
      case 11: return isCEO(user.role) ? renderPayrollTab() : null;
      case 12: return isCEO(user.role) ? renderSettingsTab() : null;
      case 13: return isCEO(user.role) ? renderSelfiesTab() : null;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderTopBar()}
      {renderTabBar()}
      <View style={styles.contentArea}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#f0f2f5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary || '#2c3e50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...SHADOW,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.accent || '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  companyName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  companySub: {
    color: '#ccc',
    fontSize: 10,
  },
  topBarCenter: {
    alignItems: 'center',
  },
  clockTime: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  clockDate: {
    color: '#ccc',
    fontSize: 10,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifButton: {
    position: 'relative',
    padding: 6,
  },
  notifIcon: {
    fontSize: 20,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.danger || '#e74c3c',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 80,
  },
  logoutBtn: {
    backgroundColor: COLORS.danger || '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  tabBarWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabBar: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: COLORS.primary || '#2c3e50',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger || '#e74c3c',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  tabContentContainer: {
    padding: 12,
    paddingBottom: 30,
  },
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary || '#2c3e50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOW,
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeGreeting: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeOffice: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 2,
  },
  welcomeDay: {
    color: '#aaa',
    fontSize: 11,
  },
  welcomeClock: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginLeft: 12,
  },
  welcomeClockTime: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  checkRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  checkBtn: {
    flex: 1,
  },
  attRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  attAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary || '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  attInfo: {
    flex: 1,
  },
  attName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  attTime: {
    fontSize: 11,
    color: '#888',
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthlyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  monthlyStats: {
    flexDirection: 'row',
    gap: 12,
  },
  monthlyStat: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  typeRow: {
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f0f2f5',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary || '#2c3e50',
  },
  typeChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#fff',
  },
  leaveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leaveInfo: {
    flex: 1,
  },
  leaveType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  leaveDate: {
    fontSize: 11,
    color: '#888',
  },
  leaveReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  taskRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  taskDate: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  taskDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  approvalTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  approvalTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
  },
  approvalTabActive: {
    backgroundColor: COLORS.primary || '#2c3e50',
  },
  approvalTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  approvalTabTextActive: {
    color: '#fff',
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  approvalInfo: {
    flex: 1,
  },
  approvalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  approvalDetail: {
    fontSize: 12,
    color: '#666',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    backgroundColor: COLORS.success || '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectBtn: {
    backgroundColor: COLORS.danger || '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary || '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 13,
    color: '#888',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary || '#2c3e50',
  },
  profileStatLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  birthdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  birthdayAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffeaa7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  birthdayEmoji: {
    fontSize: 20,
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  birthdayDate: {
    fontSize: 11,
    color: '#888',
  },
  birthdayCountdown: {
    alignItems: 'center',
  },
  birthdayDays: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary || '#2c3e50',
  },
  birthdayDaysLabel: {
    fontSize: 10,
    color: '#888',
  },
  chatContainer: {
    flex: 1,
  },
  chatMessages: {
    flex: 1,
    padding: 12,
  },
  chatMessagesContent: {
    paddingBottom: 12,
  },
  chatMsg: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  chatMsgOwn: {
    backgroundColor: COLORS.primary || '#2c3e50',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  chatMsgOther: {
    backgroundColor: '#e8e8e8',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  chatMsgName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 2,
  },
  chatMsgText: {
    fontSize: 14,
    color: '#333',
  },
  chatMsgOwn: {
    backgroundColor: COLORS.primary || '#2c3e50',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  chatMsgOwnText: {
    color: '#fff',
  },
  chatMsgTime: {
    fontSize: 9,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'right',
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  chatSendBtn: {
    backgroundColor: COLORS.primary || '#2c3e50',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  chatSendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  teamAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary || '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  teamRole: {
    fontSize: 11,
    color: '#888',
  },
  teamActions: {
    flexDirection: 'row',
    gap: 6,
  },
  markBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markBtnActive: {
    backgroundColor: COLORS.success || '#27ae60',
  },
  markBtnAbsent: {
    backgroundColor: '#e8e8e8',
  },
  markBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  payrollRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  payrollInfo: {
    flex: 1,
  },
  payrollName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  payrollRole: {
    fontSize: 11,
    color: '#888',
  },
  payrollAmounts: {
    alignItems: 'flex-end',
  },
  payrollBase: {
    fontSize: 12,
    color: '#666',
  },
  payrollDeduction: {
    fontSize: 11,
    color: COLORS.danger || '#e74c3c',
  },
  payrollNet: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.success || '#27ae60',
    marginTop: 2,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  settingsCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...SHADOW,
    gap: 6,
  },
  settingsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary || '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    maxWidth: '100%',
  },
  settingsEmail: {
    fontSize: 10,
    color: '#888',
    maxWidth: '100%',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 20,
  },
  modalButtons: {
    gap: 10,
    marginTop: 16,
  },
  selfieNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  selfieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  selfieAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary || '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selfieInfo: {
    flex: 1,
  },
  selfieName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selfieDetail: {
    fontSize: 11,
    color: '#888',
  },
  selfieViewBtn: {
    backgroundColor: COLORS.info || '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selfieViewText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

const chartStyles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    backgroundColor: COLORS.primary || '#2c3e50',
    borderRadius: 4,
    minHeight: 4,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 9,
    color: '#888',
    maxWidth: 40,
  },
});
