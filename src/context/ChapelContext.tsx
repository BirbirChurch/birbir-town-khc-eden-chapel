import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Member, 
  Committee, 
  DiscipleshipGroup, 
  ChapelPlan, 
  ChapelReport, 
  MemberFeedback, 
  VisitationRequest, 
  PortalType,
  FamilyMember
} from '../types/chapel';
import { 
  INITIAL_MEMBERS, 
  INITIAL_COMMITTEES, 
  INITIAL_DISCIPLESHIP_GROUPS, 
  INITIAL_PLANS, 
  INITIAL_REPORTS, 
  INITIAL_FEEDBACK, 
  INITIAL_VISITATION_REQUESTS,
  DEFAULT_PINS,
  calculateAgeGroup
} from '../data/seedData';

interface ChapelContextType {
  members: Member[];
  committees: Committee[];
  discipleshipGroups: DiscipleshipGroup[];
  plans: ChapelPlan[];
  reports: ChapelReport[];
  feedbackList: MemberFeedback[];
  visitationRequests: VisitationRequest[];
  activePortal: PortalType;
  unlockedPortals: Record<PortalType, boolean>;
  currentMemberPhone: string;
  currentMember: Member | null;
  pins: { coordinator: string; leaders: string; members: string };
  setActivePortal: (portal: PortalType) => void;
  unlockPortal: (portal: PortalType, pin: string) => boolean;
  lockPortal: (portal: PortalType) => void;
  setCurrentMemberPhone: (phone: string) => void;
  addMember: (member: Omit<Member, 'id' | 'ageGroup' | 'registeredDate'>) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  bulkImportMembers: (newMembers: Member[]) => void;
  updateCommitteePerson: (committeeId: string, personId: string, data: { name: string; role: string; phone: string }) => void;
  addYouthLeader: (data: { name: string; role: string; phone: string }) => void;
  deleteYouthLeader: (personId: string) => void;
  addDiscipleshipGroup: (group: Omit<DiscipleshipGroup, 'id'>) => void;
  updateDiscipleshipGroup: (id: string, group: Partial<DiscipleshipGroup>) => void;
  addPlan: (plan: Omit<ChapelPlan, 'id' | 'updatedAt'>) => void;
  updatePlan: (id: string, plan: Partial<ChapelPlan>) => void;
  deletePlan: (id: string) => void;
  addReport: (report: Omit<ChapelReport, 'id' | 'dateSubmitted' | 'status'>) => void;
  updateReportStatus: (id: string, status: 'የጸደቀ' | 'በመጠባበቅ ላይ' | 'ማስተካከያ የቀረበበት', feedbackNotes?: string) => void;
  addFeedback: (fb: Omit<MemberFeedback, 'id' | 'date' | 'status'>) => void;
  resolveFeedback: (id: string, status: 'በመከታተል ላይ' | 'ተፈጻሚ ሆኗል', actionTakenNotes: string) => void;
  addVisitationRequest: (vis: Omit<VisitationRequest, 'id' | 'requestedDate' | 'status'>) => void;
  updateVisitationStatus: (id: string, status: 'በመጠባበቅ ላይ' | 'የተመደበ' | 'ተጎብኝቷል', assignedTeam?: string) => void;
  addFamilyMember: (memberId: string, family: Omit<FamilyMember, 'id'>) => void;
  removeFamilyMember: (memberId: string, familyId: string) => void;
  resetAllData: () => void;
}

const ChapelContext = createContext<ChapelContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MEMBERS: 'eden_chapel_members_v6_enhanced_2017_aged',
  COMMITTEES: 'eden_chapel_committees_v2',
  GROUPS: 'eden_chapel_groups_v2',
  PLANS: 'eden_chapel_plans_v2',
  REPORTS: 'eden_chapel_reports_v2',
  FEEDBACK: 'eden_chapel_feedback_v2',
  VISITATIONS: 'eden_chapel_visitations_v2',
  PINS: 'eden_chapel_pins_v2'
};

export const ChapelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 50 && parsed[0]?.familyCode) {
          return parsed;
        }
      }
      return INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [committees, setCommittees] = useState<Committee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMMITTEES);
      return saved ? JSON.parse(saved) : INITIAL_COMMITTEES;
    } catch {
      return INITIAL_COMMITTEES;
    }
  });

  const [discipleshipGroups, setDiscipleshipGroups] = useState<DiscipleshipGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
      return saved ? JSON.parse(saved) : INITIAL_DISCIPLESHIP_GROUPS;
    } catch {
      return INITIAL_DISCIPLESHIP_GROUPS;
    }
  });

  const [plans, setPlans] = useState<ChapelPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
      return saved ? JSON.parse(saved) : INITIAL_PLANS;
    } catch {
      return INITIAL_PLANS;
    }
  });

  const [reports, setReports] = useState<ChapelReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return saved ? JSON.parse(saved) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [feedbackList, setFeedbackList] = useState<MemberFeedback[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      return saved ? JSON.parse(saved) : INITIAL_FEEDBACK;
    } catch {
      return INITIAL_FEEDBACK;
    }
  });

  const [visitationRequests, setVisitationRequests] = useState<VisitationRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISITATIONS);
      return saved ? JSON.parse(saved) : INITIAL_VISITATION_REQUESTS;
    } catch {
      return INITIAL_VISITATION_REQUESTS;
    }
  });

  const [pins] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PINS);
      return saved ? JSON.parse(saved) : DEFAULT_PINS;
    } catch {
      return DEFAULT_PINS;
    }
  });

  // Active portal states
  const [activePortal, setActivePortal] = useState<PortalType>('coordinator');
  const [unlockedPortals, setUnlockedPortals] = useState<Record<PortalType, boolean>>({
    coordinator: true, // Coordinator is initial view for administrator
    leaders: false,
    members: true // Member portal allows entry with direct phone or guest lookup
  });

  const [currentMemberPhone, setCurrentMemberPhone] = useState<string>('0910926126'); // Default sample member

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMITTEES, JSON.stringify(committees));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [committees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(discipleshipGroups));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [discipleshipGroups]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [plans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbackList));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [feedbackList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VISITATIONS, JSON.stringify(visitationRequests));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [visitationRequests]);

  const unlockPortal = (portal: PortalType, pin: string): boolean => {
    // Check if matching PIN or master admin bypass
    const targetPin = pins[portal];
    if (pin.trim() === targetPin || pin.trim() === '7777') {
      setUnlockedPortals(prev => ({ ...prev, [portal]: true }));
      setActivePortal(portal);
      return true;
    }
    return false;
  };

  const lockPortal = (portal: PortalType) => {
    setUnlockedPortals(prev => ({ ...prev, [portal]: false }));
  };

  const addMember = (data: Omit<Member, 'id' | 'ageGroup' | 'registeredDate'>) => {
    const ageGroup = calculateAgeGroup(data.age);
    const nextCodeNum = 101 + members.length;
    const newMember: Member = {
      ...data,
      id: `mem-${Date.now()}`,
      familyCode: data.familyCode || `eden${nextCodeNum}`,
      ageGroup,
      registeredDate: new Date().toISOString().split('T')[0],
      familyMembers: data.familyMembers || []
    };
    setMembers(prev => [newMember, ...prev]);
  };

  const updateMember = (id: string, updateData: Partial<Member>) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, ...updateData };
      if (updateData.age !== undefined) {
        updated.ageGroup = calculateAgeGroup(updateData.age);
      }
      return updated;
    }));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const bulkImportMembers = (newMembers: Member[]) => {
    setMembers(prev => {
      // Avoid exact phone duplicates if existing
      const existingPhones = new Set(prev.map(p => p.phone.trim()));
      const filteredNew = newMembers.filter(n => !existingPhones.has(n.phone.trim()));
      return [...filteredNew, ...prev];
    });
  };

  const updateCommitteePerson = (committeeId: string, personId: string, data: { name: string; role: string; phone: string }) => {
    setCommittees(prev => prev.map(c => {
      if (c.id !== committeeId) return c;
      return {
        ...c,
        members: c.members.map(m => m.id === personId ? { ...m, ...data } : m)
      };
    }));
  };

  const addYouthLeader = (data: { name: string; role: string; phone: string }) => {
    setCommittees(prev => prev.map(c => {
      if (c.id !== 'youth') return c;
      const newPerson = {
        id: `y-${Date.now()}`,
        order: c.members.length + 1,
        name: data.name,
        role: data.role,
        phone: data.phone
      };
      return {
        ...c,
        members: [...c.members, newPerson]
      };
    }));
  };

  const deleteYouthLeader = (personId: string) => {
    setCommittees(prev => prev.map(c => {
      if (c.id !== 'youth') return c;
      return {
        ...c,
        members: c.members.filter(m => m.id !== personId)
      };
    }));
  };

  const addDiscipleshipGroup = (data: Omit<DiscipleshipGroup, 'id'>) => {
    const newGroup: DiscipleshipGroup = {
      ...data,
      id: `group-${Date.now()}`
    };
    setDiscipleshipGroups(prev => [...prev, newGroup]);
  };

  const updateDiscipleshipGroup = (id: string, groupData: Partial<DiscipleshipGroup>) => {
    setDiscipleshipGroups(prev => prev.map(g => g.id === id ? { ...g, ...groupData } : g));
  };

  const addPlan = (data: Omit<ChapelPlan, 'id' | 'updatedAt'>) => {
    const newPlan: ChapelPlan = {
      ...data,
      id: `plan-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setPlans(prev => [newPlan, ...prev]);
  };

  const updatePlan = (id: string, planData: Partial<ChapelPlan>) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        ...planData,
        updatedAt: new Date().toISOString().split('T')[0]
      };
    }));
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const addReport = (data: Omit<ChapelReport, 'id' | 'dateSubmitted' | 'status'>) => {
    const newReport: ChapelReport = {
      ...data,
      id: `rep-${Date.now()}`,
      dateSubmitted: new Date().toISOString().split('T')[0],
      status: 'በመጠባበቅ ላይ'
    };
    setReports(prev => [newReport, ...prev]);
  };

  const updateReportStatus = (id: string, status: 'የጸደቀ' | 'በመጠባበቅ ላይ' | 'ማስተካከያ የቀረበበት', feedbackNotes?: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status, feedbackNotes: feedbackNotes !== undefined ? feedbackNotes : r.feedbackNotes } : r));
  };

  const addFeedback = (data: Omit<MemberFeedback, 'id' | 'date' | 'status'>) => {
    const newFb: MemberFeedback = {
      ...data,
      id: `fb-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'አዲስ'
    };
    setFeedbackList(prev => [newFb, ...prev]);
  };

  const resolveFeedback = (id: string, status: 'በመከታተል ላይ' | 'ተፈጻሚ ሆኗል', actionTakenNotes: string) => {
    setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status, actionTakenNotes } : f));
  };

  const addVisitationRequest = (data: Omit<VisitationRequest, 'id' | 'requestedDate' | 'status'>) => {
    const newVis: VisitationRequest = {
      ...data,
      id: `vis-${Date.now()}`,
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'በመጠባበቅ ላይ'
    };
    setVisitationRequests(prev => [newVis, ...prev]);
  };

  const updateVisitationStatus = (id: string, status: 'በመጠባበቅ ላይ' | 'የተመደበ' | 'ተጎብኝቷል', assignedTeam?: string) => {
    setVisitationRequests(prev => prev.map(v => v.id === id ? { ...v, status, assignedTeam: assignedTeam || v.assignedTeam } : v));
  };

  const addFamilyMember = (memberId: string, family: Omit<FamilyMember, 'id'>) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const newFam: FamilyMember = {
        ...family,
        id: `fam-${Date.now()}`
      };
      return {
        ...m,
        familyMembers: [...(m.familyMembers || []), newFam]
      };
    }));
  };

  const removeFamilyMember = (memberId: string, familyId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      return {
        ...m,
        familyMembers: (m.familyMembers || []).filter(f => f.id !== familyId)
      };
    }));
  };

  const resetAllData = () => {
    setMembers(INITIAL_MEMBERS);
    setCommittees(INITIAL_COMMITTEES);
    setDiscipleshipGroups(INITIAL_DISCIPLESHIP_GROUPS);
    setPlans(INITIAL_PLANS);
    setReports(INITIAL_REPORTS);
    setFeedbackList(INITIAL_FEEDBACK);
    setVisitationRequests(INITIAL_VISITATION_REQUESTS);
  };

  const currentMember = members.find(m => m.phone.replace(/\s+/g, '') === currentMemberPhone.replace(/\s+/g, '')) || members[0] || null;

  return (
    <ChapelContext.Provider
      value={{
        members,
        committees,
        discipleshipGroups,
        plans,
        reports,
        feedbackList,
        visitationRequests,
        activePortal,
        unlockedPortals,
        currentMemberPhone,
        currentMember,
        pins,
        setActivePortal,
        unlockPortal,
        lockPortal,
        setCurrentMemberPhone,
        addMember,
        updateMember,
        deleteMember,
        bulkImportMembers,
        updateCommitteePerson,
        addYouthLeader,
        deleteYouthLeader,
        addDiscipleshipGroup,
        updateDiscipleshipGroup,
        addPlan,
        updatePlan,
        deletePlan,
        addReport,
        updateReportStatus,
        addFeedback,
        resolveFeedback,
        addVisitationRequest,
        updateVisitationStatus,
        addFamilyMember,
        removeFamilyMember,
        resetAllData
      }}
    >
      {children}
    </ChapelContext.Provider>
  );
};

export const useChapel = () => {
  const context = useContext(ChapelContext);
  if (!context) {
    throw new Error('useChapel must be used within a ChapelProvider');
  }
  return context;
};
