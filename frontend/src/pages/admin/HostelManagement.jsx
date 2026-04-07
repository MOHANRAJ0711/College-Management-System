import { useEffect, useState } from 'react';
import { 
  FiHome, FiPlus, FiUsers, FiSettings, FiCheckCircle, FiInfo, FiTrash2, FiEdit3, FiSearch, FiFilter
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function HostelManagement() {
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hostels'); // hostels, rooms, allocations
  
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  
  const [hostelForm, setHostelForm] = useState({ name: '', type: 'boys', description: '' });
  const [roomForm, setRoomForm] = useState({ hostel: '', roomNumber: '', type: 'double', capacity: 2 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, rRes, aRes] = await Promise.all([
        api.get('/hostel'),
        api.get('/hostel/rooms'),
        api.get('/hostel/allocations')
      ]);
      setHostels(hRes.data);
      setRooms(rRes.data);
      setAllocations(aRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHostel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostel', hostelForm);
      toast.success('Hostel added successfully');
      setShowHostelModal(false);
      setHostelForm({ name: '', type: 'boys', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding hostel');
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostel/rooms', roomForm);
      toast.success('Room added successfully');
      setShowRoomModal(false);
      setRoomForm({ hostel: '', roomNumber: '', type: 'double', capacity: 2 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding room');
    }
  };

  const handleStatusUpdate = async (id, status, roomId) => {
    try {
      await api.patch(`/hostel/allocations/${id}`, { status, roomId });
      toast.success('Status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Hostel Matrix</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Campus accommodation and room allocation governance</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHostelModal(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-premium transition hover:bg-brand-700"
          >
            <FiPlus className="h-4 w-4" /> Add Hostel
          </button>
          <button 
            onClick={() => setShowRoomModal(true)}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-premium transition hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
          >
            <FiPlus className="h-4 w-4" /> Add Room
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'hostels', label: 'Hostels', icon: FiHome },
          { id: 'rooms', label: 'Rooms', icon: FiSettings },
          { id: 'allocations', label: 'Allocations Request', icon: FiUsers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-6">
        {activeTab === 'hostels' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hostels.map((hostel) => (
              <div key={hostel._id} className="glass dark:glass-dark rounded-3xl p-6 shadow-premium transition-transform hover:scale-[1.02]">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    hostel.type === 'boys' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                  }`}>
                    {hostel.type}
                  </div>
                  <FiHome className="h-5 w-5 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{hostel.name}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{hostel.description || 'No description provided'}</p>
                <div className="mt-6 flex items-center gap-4 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5"><FiUsers className="h-3 w-3" /> Warden Assigned</span>
                </div>
              </div>
            ))}
            {hostels.length === 0 && <EmptyState label="No hostels managed yet" />}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Room #</th>
                  <th className="px-6 py-4">Hostel</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white">Room {room.roomNumber}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{room.hostel?.name}</td>
                    <td className="px-6 py-4 capitalize">{room.type}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div 
                            className={`h-full ${room.isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${(room.occupiedCount / room.capacity) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px]">{room.occupiedCount}/{room.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {room.isFull ? (
                        <span className="inline-flex rounded-full bg-rose-50 px-2 py-1 text-[10px] text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">Occupied</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'allocations' && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
             <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Hostel</th>
                  <th className="px-6 py-4">Mess</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allocations.map((alloc) => (
                  <tr key={alloc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-900 dark:text-white">{alloc.student?.rollNumber}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Student ID</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{alloc.hostel?.name}</td>
                    <td className="px-6 py-4 uppercase text-[10px]">{alloc.messPreference}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase font-black ${
                        alloc.status === 'allocated' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                        alloc.status === 'requested' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {alloc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {alloc.status === 'requested' && (
                        <div className="flex justify-end gap-2 text-[10px]">
                          <button 
                            onClick={() => {
                              const rid = prompt("Enter Room ID to allocate:");
                              if(rid) handleStatusUpdate(alloc._id, 'allocated', rid);
                            }}
                            className="bg-emerald-600 text-white p-1 rounded-md px-2"
                          >Quick Allocate</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hostel Modal */}
      {showHostelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-6">New Estate</h2>
            <form onSubmit={handleAddHostel} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Hostel Name</label>
                <input 
                  type="text" 
                  value={hostelForm.name}
                  onChange={(e) => setHostelForm({...hostelForm, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Type</label>
                  <select 
                    value={hostelForm.type}
                    onChange={(e) => setHostelForm({...hostelForm, type: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Brief Description</label>
                <textarea 
                  value={hostelForm.description}
                  onChange={(e) => setHostelForm({...hostelForm, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-premium">Save Estate</button>
                <button type="button" onClick={() => setShowHostelModal(false)} className="px-6 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-6">Append Room</h2>
            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Select Hostel</label>
                <select 
                  value={roomForm.hostel}
                  onChange={(e) => setRoomForm({...roomForm, hostel: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">Select Hostel</option>
                  {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Room Number</label>
                  <input 
                    type="text" 
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({...roomForm, roomNumber: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Capacity</label>
                  <input 
                    type="number" 
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({...roomForm, capacity: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Room Type</label>
                <select 
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({...roomForm, type: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-premium">Deploy Room</button>
                <button type="button" onClick={() => setShowRoomModal(false)} className="px-6 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400">
      <FiInfo className="h-12 w-12 mb-4 opacity-20" />
      <p className="font-bold text-sm tracking-widest uppercase">{label}</p>
    </div>
  );
}
