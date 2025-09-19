
import React, { useState, useEffect, useRef } from 'react';
import type { Page, User, Course, Unit, Venue, AttendanceRecord, Student } from '../types.ts';
import { getGeoLocation, searchLocation } from '../utils/location.ts';

// --- Global declaration for Leaflet ---
declare const L: any;


interface AdminDashboardProps {
  setPage: (page: Page) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  students: Student[];
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  units: Unit[];
  setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
  venues: Venue[];
  setVenues: React.Dispatch<React.SetStateAction<Venue[]>>;
  attendance: AttendanceRecord[];
  onStartFacultySession: (sessionName: string, location: { latitude: number, longitude: number, altitude?: number | null }, radius: number) => void;
}

type ManagementTab = 'COURSES' | 'UNITS' | 'VENUES';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    setPage,
    users, setUsers,
    students,
    courses, setCourses,
    units, setUnits,
    venues, setVenues,
    attendance,
    onStartFacultySession
 }) => {
    const [currentTab, setCurrentTab] = useState<ManagementTab>('COURSES');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalFormData, setModalFormData] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState('');

    // --- Faculty Session State ---
    const [facultySessionName, setFacultySessionName] = useState('');
    const [facultySessionError, setFacultySessionError] = useState('');
    const [location, setLocation] = useState<GeolocationPosition | null>(null);
    const [isLocating, setIsLocating] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [radius, setRadius] = useState(100);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

     // --- Location & Map Effects ---
    useEffect(() => {
        getGeoLocation()
        .then(pos => {
            setLocation(pos);
            setLocationError('');
        })
        .catch(err => setLocationError(err.message))
        .finally(() => setIsLocating(false));
    }, []);

    useEffect(() => {
        const updateLocationFromMap = (latlng: { lat: number, lng: number }) => {
            const newLocation: GeolocationPosition = {
                coords: {
                    latitude: latlng.lat,
                    longitude: latlng.lng,
                    altitude: location?.coords.altitude || null,
                    accuracy: 50,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                },
                timestamp: Date.now(),
            };
            setLocation(newLocation);
            setLocationError('');
        };

        if (location && !mapRef.current) {
            const map = L.map('admin-map-container').setView([location.coords.latitude, location.coords.longitude], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            mapRef.current = map;

            markerRef.current = L.marker([location.coords.latitude, location.coords.longitude], { draggable: true }).addTo(map)
                .bindPopup('Drag to set location').openPopup();
            
            markerRef.current.on('dragend', (event: any) => {
                updateLocationFromMap(event.target.getLatLng());
            });

            map.on('click', (event: any) => {
                updateLocationFromMap(event.latlng);
            });

            circleRef.current = L.circle([location.coords.latitude, location.coords.longitude], {
                radius,
                color: '#10B981',
                fillColor: '#059669',
                fillOpacity: 0.3
            }).addTo(map);
        } else if (location && mapRef.current) {
            const latLng: [number, number] = [location.coords.latitude, location.coords.longitude];
            mapRef.current.setView(latLng);
            markerRef.current.setLatLng(latLng);
            circleRef.current.setLatLng(latLng);
        }

    }, [location]);

    useEffect(() => {
        if (circleRef.current) {
        circleRef.current.setRadius(radius);
        }
    }, [radius]);


    const openModal = () => {
        setModalFormData({});
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setModalFormData({ ...modalFormData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        switch (currentTab) {
            case 'COURSES':
                const { name: courseName } = modalFormData;
                if (!courseName) { setFormError("Course name is required."); return; }
                setCourses([...courses, { id: Date.now().toString(), name: courseName }]);
                break;
            case 'UNITS':
                const { name: unitName, courseId } = modalFormData;
                if (!unitName || !courseId) { setFormError("Unit name and course are required."); return; }
                if (!courses.some(c => c.id === courseId)) { setFormError("Invalid course selected."); return; }
                setUnits([...units, { id: Date.now().toString(), name: unitName, courseId }]);
                break;
            case 'VENUES':
                 const { name: venueName, latitude, longitude } = modalFormData;
                if (!venueName) { setFormError("Venue name is required."); return; }
                setVenues([...venues, { 
                    id: Date.now().toString(), 
                    name: venueName,
                    latitude: latitude ? parseFloat(latitude) : undefined,
                    longitude: longitude ? parseFloat(longitude) : undefined,
                }]);
                break;
        }
        closeModal();
    };

    const handleDeleteItem = (id: string, type: ManagementTab) => {
        if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
            switch (type) {
                case 'COURSES':
                    if (units.some(unit => unit.courseId === id)) { alert("Cannot delete. Course is associated with units."); return; }
                    if (students.some(student => student.courseId === id)) { alert("Cannot delete. Course has enrolled students."); return; }
                    setCourses(prev => prev.filter(course => course.id !== id));
                    break;
                case 'UNITS':
                    if (attendance.some(record => record.unitId === id)) { alert("Cannot delete. Unit has existing attendance records."); return; }
                    setUnits(prev => prev.filter(unit => unit.id !== id));
                    break;
                case 'VENUES':
                    if (attendance.some(record => record.venueId === id)) { alert("Cannot delete. Venue has existing attendance records."); return; }
                    setVenues(prev => prev.filter(venue => venue.id !== id));
                    break;
            }
        }
    };

    const handleStartFacultySession = () => {
        if (!facultySessionName.trim()) {
            setFacultySessionError('Session name cannot be empty.');
            return;
        }
        if (!location) {
            setFacultySessionError('Please set a location for the session.');
            return;
        }
        setFacultySessionError('');
        onStartFacultySession(facultySessionName, location.coords, radius);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchError('');
        setSearchResults([]);
        try {
            const results = await searchLocation(searchQuery);
            if (results.length === 0) {
                setSearchError('No locations found.');
            }
            setSearchResults(results);
        } catch (error) {
            setSearchError('Failed to search. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectLocation = (result: any) => {
        const newLocation: GeolocationPosition = {
            coords: {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                altitude: null, accuracy: 100, altitudeAccuracy: null, heading: null, speed: null,
            },
            timestamp: Date.now(),
        };
        setLocation(newLocation);
        setLocationError('');
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',')[0]);
    };

    
    const renderModal = () => {
        if (!isModalOpen) return null;
        const title = `Add New ${currentTab.slice(0, -1)}`;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                    <h3 className="text-xl font-bold mb-4 text-[#111827]">{title}</h3>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        { currentTab === 'COURSES' && <InputField name="name" label="Course Name" value={modalFormData.name} onChange={handleFormChange} /> }
                        { currentTab === 'UNITS' && <>
                            <InputField name="name" label="Unit Name" value={modalFormData.name} onChange={handleFormChange} />
                             <div>
                                <label htmlFor="courseId" className="block text-sm font-medium text-[#374151]">Course</label>
                                <select id="courseId" name="courseId" value={modalFormData.courseId || ''} onChange={handleFormChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent" required>
                                    <option value="">Select a course</option>
                                    {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                                </select>
                            </div>
                        </> }
                        { currentTab === 'VENUES' && <>
                           <InputField name="name" label="Venue Name" value={modalFormData.name} onChange={handleFormChange} />
                           <InputField name="latitude" label="Latitude (Optional)" value={modalFormData.latitude} onChange={handleFormChange} type="number" required={false} />
                           <InputField name="longitude" label="Longitude (Optional)" value={modalFormData.longitude} onChange={handleFormChange} type="number" required={false} />
                        </> }
                        {formError && <p className="text-red-600 text-sm">{formError}</p>}
                        <div className="mt-6 flex justify-end space-x-4">
                            <button type="button" onClick={closeModal} className="bg-[#6B7280] hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
                            <button type="submit" className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };
    
    const renderContent = () => {
        let data: any[] = [];
        let columns: { key: string; label: string }[] = [];
        switch (currentTab) {
            case 'COURSES': data = courses; columns = [{key: 'name', label: 'Name'}]; break;
            case 'UNITS': data = units.map(u => ({...u, courseName: courses.find(c => c.id === u.courseId)?.name || 'N/A' })); columns = [{key: 'name', label: 'Name'}, {key: 'courseName', label: 'Course'}]; break;
            case 'VENUES': data = venues; columns = [{key: 'name', label: 'Name'}, { key: 'latitude', label: 'Latitude'}, {key: 'longitude', label: 'Longitude'}]; break;
        }
        return (
            <div>
                 <button onClick={openModal} className="mb-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded">
                    Add New {currentTab.slice(0, -1)}
                 </button>
                 {data.length > 0 ? (
                    <div className="overflow-x-auto"><table className="w-full text-left">
                        <thead className="text-xs text-[#6B7280] uppercase bg-gray-50"><tr>
                            {columns.map(col => <th key={col.key} scope="col" className="px-6 py-3">{col.label}</th>)}
                            <th scope="col" className="px-6 py-3 text-right">Action</th>
                        </tr></thead>
                        <tbody>{data.map(item => (
                            <tr key={item.id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                                {columns.map(col => <td key={col.key} className="px-6 py-4 text-[#111827] whitespace-nowrap">{item[col.key] ?? 'N/A'}</td>)}
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDeleteItem(item.id, currentTab)} className="text-red-600 hover:text-red-500 font-medium">Delete</button>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                 ) : <p className="text-[#6B7280] mt-4">No {currentTab.toLowerCase()} found.</p>}
            </div>
        )
    };
    
    return (
        <div className="max-w-6xl mx-auto">
            {renderModal()}
            <h2 className="text-3xl font-bold mb-6 text-[#111827]">Admin Dashboard</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <StatCard title="Total Students" value={students.length} />
                <StatCard title="Total Lecturers" value={users.filter(u => u.role === 'LECTURER').length} />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4 text-[#111827]">Start New Faculty Attendance Session</h3>
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left side: Map */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#374151]">Session Location</label>
                        <p className="text-xs text-[#6B7280] mb-1">Drag the marker or click the map to set the precise location.</p>
                         <div id="admin-map-container" className="h-64 w-full bg-gray-200 rounded-lg" aria-label="Map for setting faculty attendance geofence">
                            {isLocating && <div className="flex items-center justify-center h-full text-[#6B7280]">Locating...</div>}
                            {locationError && <div className="flex items-center justify-center h-full text-red-600 p-4">{locationError}</div>}
                        </div>
                        {location && (
                            <div className="bg-gray-100 p-2 rounded-md text-xs text-[#374151] grid grid-cols-2 gap-2">
                                <p><b>Lat:</b> {location.coords.latitude.toFixed(5)}</p>
                                <p><b>Lon:</b> {location.coords.longitude.toFixed(5)}</p>
                            </div>
                        )}
                    </div>
                    {/* Right side: Controls */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="session-name" className="block text-sm font-medium text-[#374151]">Session Name</label>
                            <input type="text" id="session-name" placeholder="e.g., Staff Meeting" value={facultySessionName} onChange={e => setFacultySessionName(e.target.value)} className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#374151]">Set Location</label>
                            <button onClick={() => { setIsLocating(true); setLocationError(''); getGeoLocation().then(pos => { setLocation(pos); setLocationError('')}).catch(err => setLocationError(err.message)).finally(() => setIsLocating(false))}} disabled={isLocating} className="mt-1 w-full bg-[#6B7280] hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-400">
                                Use My Current Location
                            </button>
                            <div className="mt-2 relative">
                                <div className="flex gap-2">
                                    <input type="search" placeholder="Or search for a location..." value={searchQuery} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} onChange={e => { setSearchQuery(e.target.value); setSearchResults([]) }} className="flex-grow w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"/>
                                    <button onClick={handleSearch} disabled={isSearching} className="px-4 py-2 bg-[#6B7280] hover:bg-gray-600 text-white font-semibold rounded-md disabled:bg-gray-500">{isSearching ? '...' : 'Search'}</button>
                                </div>
                                {(searchResults.length > 0 || searchError) && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 text-[#111827] rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                        {searchError && <li className="px-3 py-2 text-red-600">{searchError}</li>}
                                        {searchResults.map((result) => (
                                            <li key={result.place_id}>
                                                <button onClick={() => handleSelectLocation(result)} className="w-full text-left px-3 py-2 hover:bg-[#10B981] hover:text-white focus:bg-[#10B981] focus:text-white focus:outline-none transition-colors duration-150">
                                                    {result.display_name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="radius-input" className="block text-sm font-medium text-[#374151]">Attendance Radius ({radius} meters)</label>
                            <input id="radius-input" type="range" min="10" max="1000" step="10" value={radius} onChange={e => setRadius(parseInt(e.target.value, 10))} className="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        {facultySessionError && <p className="text-red-600 text-sm">{facultySessionError}</p>}
                        <button onClick={handleStartFacultySession} disabled={isLocating || !!locationError} className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-400">
                            {isLocating ? 'Getting Location...' : 'Start Session'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                 <ActionCard title="Manage Students" description="Add, remove, and manage student records and photos." onClick={() => setPage('ADD_STUDENT')} />
                 <ActionCard title="Manage Lecturers" description="Add, remove, and manage lecturer accounts and photos." onClick={() => setPage('MANAGE_LECTURERS')} />
                 <ActionCard title="View Lecturer Attendance" description="View and export attendance records for all lecturers." onClick={() => setPage('VIEW_LECTURER_ATTENDANCE')} />
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-[#111827]">System Data Management</h3>
                <div className="flex border-b border-gray-200 mb-6">
                    {(['COURSES', 'UNITS', 'VENUES'] as ManagementTab[]).map(tab => (
                        <button key={tab} onClick={() => setCurrentTab(tab)} className={`py-2 px-4 font-semibold ${currentTab === tab ? 'border-b-2 border-[#10B981] text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

const ActionCard: React.FC<{title: string, description: string, onClick: () => void}> = ({ title, description, onClick }) => (
  <div onClick={onClick} className="bg-white rounded-lg shadow-lg p-6 text-center cursor-pointer border border-gray-200 hover:border-[#10B981] transform hover:-translate-y-1 transition-all duration-300">
    <h3 className="text-xl font-semibold mb-2 text-[#111827]">{title}</h3>
    <p className="text-[#6B7280]">{description}</p>
  </div>
);

const StatCard: React.FC<{title: string, value: number | string}> = ({ title, value }) => (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
        <h3 className="text-lg font-semibold text-[#6B7280]">{title}</h3>
        <p className="text-4xl font-bold text-[#111827] mt-2">{value}</p>
    </div>
);

const InputField: React.FC<{name: string, label: string, value?: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void, type?: string, required?: boolean}> = ({ name, label, value, onChange, type = 'text', required = true }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-[#374151]">{label}</label>
        <input type={type} id={name} name={name} value={value || ''} onChange={onChange} className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent" required={required} step="any" />
    </div>
);

export default AdminDashboard;