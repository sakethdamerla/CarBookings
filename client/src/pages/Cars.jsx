import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { Plus, Edit, Trash, Search, Car, AlertCircle, ImageIcon, Loader2 } from 'lucide-react';

const Cars = () => {
    const queryClient = useQueryClient();
    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '', model: '', registrationNumber: '', type: 'Sedan', status: 'available', pricePer24h: 0,
        transmission: 'Manual', fuelType: 'Petrol', seats: 4
    });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: cars = [], isLoading: loading } = useQuery({
        queryKey: ['cars'],
        queryFn: async () => {
            const { data } = await api.get('/cars');
            return data;
        },
    });

    useEffect(() => {
        const handleRefresh = () => queryClient.invalidateQueries(['cars']);
        window.addEventListener('refreshData', handleRefresh);
        return () => window.removeEventListener('refreshData', handleRefresh);
    }, [queryClient]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('model', formData.model);
            data.append('registrationNumber', formData.registrationNumber);
            data.append('type', formData.type);
            data.append('status', formData.status);
            data.append('pricePer24h', formData.pricePer24h);
            data.append('transmission', formData.transmission);
            data.append('fuelType', formData.fuelType);
            data.append('seats', formData.seats);
            if (formData.image) {
                data.append('image', formData.image);
            }

            if (editingId) {
                console.log(`[EditDebug] Updating car ${editingId}...`);
                await api.put(`/cars/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('[EditDebug] Update successful');
            } else {
                await api.post('/cars', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            queryClient.invalidateQueries(['cars']);
            setFormVisible(false);
            setFormData({ name: '', model: '', registrationNumber: '', type: 'Sedan', status: 'available', pricePer24h: 0, image: null, transmission: 'Manual', fuelType: 'Petrol', seats: 4 });
            setEditingId(null);
        } catch (error) {
            console.error('[EditDebug] Submission failed:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Failed to save car details');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (car) => {
        setFormData({ ...car, image: null, pricePer24h: car.pricePer24h || 0 }); // Don't preload image file
        setEditingId(car._id);
        setFormVisible(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this car?')) {
            try {
                await api.delete(`/cars/${id}`);
                queryClient.invalidateQueries(['cars']);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const filteredCars = cars.filter(car =>
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Fleet Management</h2>
                    <p className="text-gray-500">Manage your vehicle inventory and status</p>
                </div>
                <button
                    onClick={() => {
                        setFormVisible(true);
                        setEditingId(null);
                        setFormData({ name: '', model: '', registrationNumber: '', type: 'Sedan', status: 'available', pricePer24h: 0 });
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all text-sm font-semibold flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Vehicle
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search cars..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : filteredCars.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {filteredCars.map((car) => (
                                <div
                                    key={car._id}
                                    onClick={() => handleEdit(car)}
                                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all active:scale-95 group flex flex-col cursor-pointer"
                                >
                                    <div className="relative h-40 md:h-48 bg-gray-100 overflow-hidden">
                                        {car.images && car.images.length > 0 ? (
                                            <img src={car.images[0]} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <ImageIcon className="w-10 h-10" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex gap-2 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(car); }}
                                                className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(car._id); }}
                                                className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-3 left-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-md shadow-sm ${car.status === 'available' ? 'bg-green-100/90 text-green-800' : 'bg-red-100/90 text-red-800'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${car.status === 'available' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                {car.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">{car.name}</h3>
                                                <p className="text-sm text-gray-500">{car.model}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                                                {car.type}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                            <div className="text-xs text-gray-400 font-mono">
                                                {car.registrationNumber}
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xs text-gray-400">Price / 24h</span>
                                                <span className="font-bold text-blue-600 text-lg">₹{car.pricePer24h || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No vehicles found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {formVisible && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
                                <input type="text" placeholder="e.g. Toyota Camry" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model Year/Variant</label>
                                <input type="text" placeholder="e.g. 2023 Hybrid" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                                <input type="text" placeholder="e.g. ABC-1234" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price per 24h</label>
                                <input type="number" placeholder="e.g. 50" min="0" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value={formData.pricePer24h} onChange={(e) => setFormData({ ...formData, pricePer24h: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="SUV">SUV</option>
                                        <option value="Sedan">Sedan</option>
                                        <option value="Hatchback">Hatchback</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="available">Available</option>
                                        <option value="unavailable">Unavailable</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                                    <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.transmission} onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}>
                                        <option value="Manual">Manual</option>
                                        <option value="Automatic">Automatic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                                    <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.fuelType} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}>
                                        <option value="Petrol">Petrol</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="Electric">Electric</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                                    <input type="number" min="2" max="10" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.seats} onChange={(e) => setFormData({ ...formData, seats: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setFormVisible(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors" disabled={isSubmitting}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors flex items-center justify-center min-w-[140px]">
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        editingId ? 'Save Changes' : 'Create Vehicle'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cars;
