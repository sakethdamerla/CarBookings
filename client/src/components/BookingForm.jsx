import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { X, User, Phone, Check } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Swal from 'sweetalert2';
import moment from 'moment';

const BookingForm = ({ onClose, onSuccess, initialData = {}, isCustomerView = false }) => {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        customerName: initialData?.customerName || '',
        mobile: initialData?.mobile || '',
        bookingType: initialData?.bookingType || 'car_only',
        car: initialData?.car || '',
        driver: '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        totalAmount: initialData?.totalAmount || 0,
        pickupLocation: '',
        dropLocation: '',
    });

    const [cars, setCars] = useState([]);
    const [currentTime, setCurrentTime] = useState(moment().format('YYYY-MM-DDTHH:mm'));
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && isCustomerView) {
            setFormData(prev => ({
                ...prev,
                customerName: user.name || prev.customerName,
                mobile: user.mobile || prev.mobile
            }));
        }
    }, [user, isCustomerView]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const carsRes = await api.get('/cars');
                setCars(carsRes.data.filter(c => c.status === 'available'));
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Basic validation
            if (formData.bookingType !== 'driver_only' && !formData.car) throw new Error('Please select a car');

            if (formData.bookingType === 'car_only' && !formData.pickupLocation) throw new Error('Please enter car handling location');
            if (formData.bookingType !== 'car_only') {
                if (!formData.pickupLocation) throw new Error('Please enter pickup location');
                if (!formData.dropLocation) throw new Error('Please enter drop location');
            }

            // If car_only, use pickupLocation for dropLocation if not provided
            const finalData = { ...formData };
            if (finalData.bookingType === 'car_only') {
                finalData.dropLocation = finalData.pickupLocation;
            }

            await api.post('/bookings', finalData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error creating booking');
        }
    };

    if (Object.keys(formData).length === 0 && !isCustomerView) return null; // Prevent render if no data in admin mode initially

    // If successfully submitted (logic to be handled by parent or here if we added a success state)
    // For now, reliance on onSuccess prop which usually refetches.
    // We will inject the alert BEFORE closing in handleSubmit above.

    /* 
       Actually, to show the message, we should probably use a simple window.alert 
       or a temporary success state before closing. 
       Given the constraints, window.alert is the surest way to pause before close.
    */
    const handleConfirm = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const newErrors = {};
        if (!formData.customerName) newErrors.customerName = 'Required';
        if (!formData.mobile) newErrors.mobile = 'Required';
        if (!formData.startDate) newErrors.startDate = 'Required';
        if (!formData.endDate) newErrors.endDate = 'Required';
        if (formData.bookingType !== 'driver_only' && !formData.car) newErrors.car = 'Please select a car';

        if (formData.bookingType === 'car_only' && !formData.pickupLocation) newErrors.pickupLocation = 'Required';
        if (formData.bookingType !== 'car_only') {
            if (!formData.pickupLocation) newErrors.pickupLocation = 'Required';
            if (!formData.dropLocation) newErrors.dropLocation = 'Required';
        }

        if (moment(formData.endDate).isSameOrBefore(moment(formData.startDate))) {
            setError('End date/time must be after start date/time');
            setLoading(false);
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setError('Please fill in required fields');
            setLoading(false);
            return;
        }

        try {
            // If car_only, use pickupLocation for dropLocation if not provided
            const finalData = {
                ...formData,
                // Treat the picked date-time as IST and convert to UTC ISO for the server
                startDate: moment(formData.startDate).utcOffset("+05:30", true).toISOString(),
                endDate: moment(formData.endDate).utcOffset("+05:30", true).toISOString()
            };
            if (finalData.bookingType === 'car_only') {
                finalData.dropLocation = finalData.pickupLocation;
            }

            // Sanitize driver field - send null if empty string
            if (!finalData.driver) {
                finalData.driver = null;
            }

            await api.post('/bookings', finalData);

            await Swal.fire({
                title: 'Booking Submitted!',
                text: 'Your request is received. The final price will be calculated and shared by the Admin shortly.',
                icon: 'success',
                confirmButtonColor: '#2563EB',
                confirmButtonText: 'Great!'
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error creating booking');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800">
                        {isCustomerView ? 'Complete Your Booking' : 'New Booking'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleConfirm} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                            <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        {/* User Details Section */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.customerName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100'}`}
                                    value={formData.customerName}
                                    onChange={e => {
                                        setFormData({ ...formData, customerName: e.target.value });
                                        if (errors.customerName) setErrors({ ...errors, customerName: null });
                                    }}
                                />
                                {errors.customerName && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.customerName}</p>}
                            </div>

                            <div className="relative group">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Mobile Number"
                                    required
                                    className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.mobile ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100'}`}
                                    value={formData.mobile}
                                    onChange={e => {
                                        setFormData({ ...formData, mobile: e.target.value });
                                        if (errors.mobile) setErrors({ ...errors, mobile: null });
                                    }}
                                />
                                {errors.mobile && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.mobile}</p>}
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Start Date</label>
                                <input
                                    type="datetime-local"
                                    required
                                    min={currentTime}
                                    className={`w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.startDate ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100'}`}
                                    value={formData.startDate}
                                    onChange={e => {
                                        setFormData({ ...formData, startDate: e.target.value, endDate: e.target.value > formData.endDate ? e.target.value : formData.endDate });
                                        if (errors.startDate) setErrors({ ...errors, startDate: null });
                                    }}
                                />
                                {errors.startDate && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.startDate}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">End Date</label>
                                <input
                                    type="datetime-local"
                                    required
                                    min={formData.startDate || currentTime}
                                    className={`w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.endDate ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100'}`}
                                    value={formData.endDate}
                                    onChange={e => {
                                        setFormData({ ...formData, endDate: e.target.value });
                                        if (errors.endDate) setErrors({ ...errors, endDate: null });
                                    }}
                                />
                                {errors.endDate && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.endDate}</p>}
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className="space-y-3">
                            {formData.bookingType === 'car_only' ? (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Car Handling Location</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Where will you pick up & drop off?"
                                        className={`w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.pickupLocation ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100'}`}
                                        value={formData.pickupLocation}
                                        onChange={e => {
                                            setFormData({ ...formData, pickupLocation: e.target.value });
                                            if (errors.pickupLocation) setErrors({ ...errors, pickupLocation: null });
                                        }}
                                    />
                                    {errors.pickupLocation && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.pickupLocation}</p>}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Pickup Location</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter pickup address"
                                            className={`w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.pickupLocation ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100'}`}
                                            value={formData.pickupLocation}
                                            onChange={e => {
                                                setFormData({ ...formData, pickupLocation: e.target.value });
                                                if (errors.pickupLocation) setErrors({ ...errors, pickupLocation: null });
                                            }}
                                        />
                                        {errors.pickupLocation && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.pickupLocation}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Drop Location</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter drop address"
                                            className={`w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.dropLocation ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100'}`}
                                            value={formData.dropLocation}
                                            onChange={e => {
                                                setFormData({ ...formData, dropLocation: e.target.value });
                                                if (errors.dropLocation) setErrors({ ...errors, dropLocation: null });
                                            }}
                                        />
                                        {errors.dropLocation && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.dropLocation}</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Booking Type Toggle for Customer */}
                        {isCustomerView ? (
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between cursor-pointer"
                                onClick={() => setFormData({ ...formData, bookingType: formData.bookingType === 'car_only' ? 'car_with_driver' : 'car_only' })}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.bookingType === 'car_with_driver' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                        {formData.bookingType === 'car_with_driver' && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-gray-800">Need a Driver?</div>
                                        <div className="text-xs text-gray-500">We'll provide a professional Driver</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <select
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                                value={formData.bookingType}
                                onChange={e => setFormData({ ...formData, bookingType: e.target.value })}
                            >
                                <option value="car_only">Car Only</option>
                                <option value="driver_only">Driver Only</option>
                                <option value="car_with_driver">Car + Driver</option>
                            </select>
                        )}

                        {/* Driver Cost Warning */}
                        {(formData.bookingType === 'car_with_driver' || formData.bookingType === 'driver_only') && (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-xl text-xs border border-yellow-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="mt-0.5 text-base">⚠️</span>
                                <div>
                                    <span className="font-semibold block mb-0.5">Additional Charges Apply</span>
                                    Hiring a driver will incur extra costs. The final amount will be calculated and updated by the admin upon confirmation.
                                </div>
                            </div>
                        )}

                        {/* Car Selection (Hidden if Car provided in initialData for Customer) */}
                        {(!isCustomerView || !initialData.car) && formData.bookingType !== 'driver_only' && (
                            <>
                                <select
                                    className={`w-full p-2.5 bg-gray-50 border rounded-xl text-sm outline-none ${errors.car ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200'}`}
                                    value={formData.car}
                                    onChange={e => {
                                        setFormData({ ...formData, car: e.target.value });
                                        if (errors.car) setErrors({ ...errors, car: null });
                                    }}
                                >
                                    <option value="">Select Car</option>
                                    {cars.map(c => <option key={c._id} value={c._id}>{c.name} ({c.model})</option>)}
                                </select>
                                {errors.car && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.car}</p>}
                            </>
                        )}

                        {!isCustomerView && (
                            <input
                                type="number"
                                placeholder="Total Amount (₹) (Optional)"
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                                value={formData.totalAmount}
                                onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                            />
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Confirm Booking</span>
                                    <Check className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingForm;
