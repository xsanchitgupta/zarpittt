/// <reference types="@types/google.maps" />
'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import Script from 'next/script';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ToastContainer, { toast } from '@/components/Toast';
import { getCart, getCartTotal, getCartSavings, clearCart, formatPrice, type CartItem, parseAddress } from '@/lib/utils';
import { formatOptionsSummary } from '@/lib/companion';
import { useAuth } from '@/lib/auth-context';
import { authFetch } from '@/lib/auth-fetch';
import supabase from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';
import { isLocationServiceable } from '@/lib/data';
import type { Address } from '@/lib/database.types';

import { ShoppingCart, MapPin, Plus, Navigation, Clock, ShieldCheck, CreditCard, Smartphone, Wallet, ChevronLeft, ChevronRight, Info, AlertCircle, CheckCircle2, Search, X, Map as MapIcon, Target, Loader2, Mail } from 'lucide-react';

const ALL_TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'];

  // Parse slot string to 24h hour number
  const parseSlotHour = (t: string): number => {
    let h = parseInt(t.split(':')[0]);
    if (t.includes('PM') && h !== 12) h += 12;
    if (t.includes('AM') && h === 12) h = 0;
    return h;
  };

  // Helper to get local YYYY-MM-DD string
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

export default function CheckoutPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [availableDates] = useState(() => generateDates());
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [soldoutDates, setSoldoutDates] = useState<string[]>([]);

  // Get valid slots for a given date string (YYYY-MM-DD)
  const getValidSlots = (dateStr: string): string[] => {
    if (soldoutDates.includes(dateStr)) return [];
    const isToday = dateStr === getLocalDateStr(new Date());
    if (!isToday) return ALL_TIME_SLOTS;
    // Minimum bookable hour = current hour + 1 (rounded up)
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    
    // Default: current hour + 1
    let minHour = h + 1 + (m > 0 ? 1 : 0);
    
    // Exception: After 7:30 PM (19:30), allow the 8:00 PM slot (hour 20)
    if (h === 19 && m >= 30) {
      minHour = 20;
    }
    
    return ALL_TIME_SLOTS.filter(t => parseSlotHour(t) >= minHour);
  };
  const [processing, setProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrText, setNewAddrText] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'serviceable' | 'not_serviceable'>('idle');
  const [detectedArea, setDetectedArea] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [houseNo, setHouseNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [discountAmt, setDiscountAmt] = useState(0);
  
  // Guest Checkout State
  const [guestPhone, setGuestPhone] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Auth feedback state
  const [authChecking, setAuthChecking] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: 'info' | 'success' | 'error', msg: string } | null>(null);
  const [viewerCount, setViewerCount] = useState(5);

  // Dynamic Availability State
  type SlotAvail = { time: string; available: boolean; reason?: string };
  const [slotAvailability, setSlotAvailability] = useState<SlotAvail[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(60);

  const [activeAreas, setActiveAreas] = useState<any[]>([]);

  useEffect(() => {
    setViewerCount(Math.floor(Math.random() * 150) + 100);
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(100, prev + Math.floor(Math.random() * 11) - 5));
    }, 5000);
    fetch('/api/service-areas').then(res => res.json()).then(({data}) => {
      if (data && data.length > 0) setActiveAreas(data);
    });
    return () => clearInterval(interval);
  }, []);

  const dateScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (dateScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = dateScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollDates = (direction: 'left' | 'right') => {
    if (dateScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      dateScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      // The onScroll event will trigger checkScroll
    }
  };

  // Map & Autocomplete State
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 28.4744, lng: 77.5040 }); // Default Greater Noida
  const mapRef = useRef<HTMLDivElement>(null);

  // Load Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps disabled: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      setGeocoder(new google.maps.Geocoder());
      setAutocompleteService(new google.maps.places.AutocompleteService());
    }).catch(err => {
      console.error('Failed to load Google Maps script:', err);
    });
  }, []);

  const handleSearchChange = (val: string) => {
    setAddressSearch(val);
    if (!val || !autocompleteService) {
      setPredictions([]);
      return;
    }
    autocompleteService.getPlacePredictions({ 
      input: val, 
      componentRestrictions: { country: 'in' },
      locationBias: { radius: 10000, center: { lat: 28.4744, lng: 77.5040 } } 
    }, (preds) => {
      setPredictions(preds || []);
    });
  };

  const selectPrediction = (p: google.maps.places.AutocompletePrediction) => {
    setAddressSearch(p.description);
    setPredictions([]);
    
    // Get Details
    if (!geocoder) return;
    geocoder.geocode({ placeId: p.place_id }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        setUserLat(lat);
        setUserLng(lng);
        setNewAddrText(results[0].formatted_address);
        setShowAddAddress(true);
        setSelectedAddressId(null);
        setDetectedArea(p.structured_formatting.main_text);
      }
    });
  };

  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoder) return;
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setNewAddrText(results[0].formatted_address);
        setDetectedArea(results[0].address_components[0].long_name);
        setShowAddAddress(true);
        setSelectedAddressId(null);
      }
    });
  };

  const detectLocation = () => {
    if (typeof window === 'undefined') return;
    
    setLocationStatus('detecting');

    const fallbackToIp = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            setUserLat(data.latitude);
            setUserLng(data.longitude);
            setLocationStatus('serviceable');
            reverseGeocode(data.latitude, data.longitude);
            toast.success('Success', 'Approximate location detected via IP.');
            return;
          }
        }
        throw new Error('IP fallback failed');
      } catch (err) {
        setLocationStatus('idle');
        toast.error('Failed', 'Could not detect location. Please search or pick on map.');
      }
    };

    if (!navigator.geolocation) {
      fallbackToIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        setLocationStatus('serviceable');
        reverseGeocode(latitude, longitude);
        toast.success('Success', 'Current location detected accurately.');
      },
      (err) => {
        console.warn('Geolocation failed, falling back to IP:', err);
        fallbackToIp();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Init Map when Modal opens
  useEffect(() => {
    if (showMapPicker && mapRef.current && !map) {
      const m = new google.maps.Map(mapRef.current, {
        center: { lat: userLat || 28.4744, lng: userLng || 77.5040 },
        zoom: 17,
        disableDefaultUI: true,
        zoomControl: true,
      });
      setMap(m);
      
      m.addListener('idle', () => {
        const center = m.getCenter();
        if (center) {
          setMapCenter({ lat: center.lat(), lng: center.lng() });
        }
      });
    }
  }, [showMapPicker]);

  const confirmMapLocation = () => {
    setUserLat(mapCenter.lat);
    setUserLng(mapCenter.lng);
    reverseGeocode(mapCenter.lat, mapCenter.lng);
    setShowMapPicker(false);
  };

  // 1. Initial Mount + Restore persisted checkout data
  useEffect(() => {

    setMounted(true);
    setCart(getCart());
    
    // Read stored location
    try {
      const stored = localStorage.getItem('zarpit_location');
      if (stored) {
        const loc = JSON.parse(stored);
        if (loc.status === 'serviceable') {
          setLocationStatus('serviceable');
          setDetectedArea(loc.area);
        } else if (loc.status === 'not_serviceable') {
          setLocationStatus('not_serviceable');
        }
        if (loc.lat && loc.lng) {
          setUserLat(loc.lat);
          setUserLng(loc.lng);
        }
        if (loc.address) {
          setNewAddrText(loc.address);
          setShowAddAddress(true);
          setSelectedAddressId(null);
        }
      }
    } catch { /* ignore */ }

    // Restore checkout data after auth redirect
    try {
      const pending = localStorage.getItem('zarpit_pending_checkout');
      if (pending) {
        const d = JSON.parse(pending);
        if (d.guestName) setGuestName(d.guestName);
        if (d.guestPhone) setGuestPhone(d.guestPhone);
        if (d.guestEmail) setGuestEmail(d.guestEmail);
        if (d.address) { setNewAddrText(d.address); setShowAddAddress(true); }
        if (d.addressLabel) setNewAddrLabel(d.addressLabel);
        if (d.lat) setUserLat(d.lat);
        if (d.lng) setUserLng(d.lng);
        if (d.scheduledDate) setScheduledDate(d.scheduledDate);
        if (d.scheduledTime) setScheduledTime(d.scheduledTime);
        if (d.instructions) setInstructions(d.instructions);
        // Clear after restore so it doesn't re-apply
        localStorage.removeItem('zarpit_pending_checkout');
        toast.success('Welcome back!', 'Your checkout details have been restored.');
      }
    } catch { /* ignore */ }
  }, []);

  // 1b. Fetch sold out dates from system_settings
  useEffect(() => {
    const fetchSoldoutDates = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'soldout_dates')
          .maybeSingle();
        if (data?.value) {
          let parsed: string[] = [];
          try {
            parsed = JSON.parse(data.value);
            if (!Array.isArray(parsed)) {
              parsed = data.value.split(',').map((d: string) => d.trim()).filter(Boolean);
            }
          } catch {
            parsed = data.value.split(',').map((d: string) => d.trim()).filter(Boolean);
          }
          setSoldoutDates(parsed);
        }
      } catch (err) {
        console.error('Failed to fetch soldout dates:', err);
      }
    };
    fetchSoldoutDates();
  }, []);

  // 2. Set default date
  useEffect(() => {
    if (mounted && availableDates.length > 0) {
      const isCurrentSoldOut = scheduledDate && soldoutDates.includes(scheduledDate);
      if (!scheduledDate || isCurrentSoldOut) {
        const firstAvail = availableDates.find(d => {
          const dateStr = getLocalDateStr(d);
          return !soldoutDates.includes(dateStr) && getValidSlots(dateStr).length > 0;
        });
        if (firstAvail) {
          setScheduledDate(getLocalDateStr(firstAvail));
        } else if (!scheduledDate) {
          setScheduledDate(getLocalDateStr(availableDates[0]));
        }
      }
    }
  }, [mounted, availableDates, scheduledDate, soldoutDates]);

  // 3. Load addresses
  useEffect(() => {
    if (!user) return;
    const fetchSavedAddresses = async () => {
      try {
        const res = await authFetch(`/api/profile/addresses?userId=${user.id}`);
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (data && data.length > 0) {
          const parsedData = data.map(parseAddress);
          setAddresses(parsedData as Address[]);
          
          const hasGlobalLocation = !!localStorage.getItem('zarpit_location');
          if (!hasGlobalLocation && !newAddrText) {
            setSelectedAddressId(data[0].id);
          } else if (hasGlobalLocation) {
            setSelectedAddressId(null);
          }
        }
      } catch (err) {
        console.error('[Checkout] Failed to load saved addresses:', err);
        // Fallback to client fetch
        supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at').then(({ data }) => {
          if (data && data.length > 0) {
            setAddresses(data.map(parseAddress) as Address[]);
          }
        });
      }
    };
    fetchSavedAddresses();
  }, [user]);

  // 4. Validate time slots (minimum +2 hours from now, no instant booking)
  useEffect(() => {
    if (!scheduledDate || !mounted) return;
    
    const validSlots = getValidSlots(scheduledDate);
    const todayStr = getLocalDateStr(new Date());

    // If today has no valid slots left, auto-switch to tomorrow
    if (validSlots.length === 0 && scheduledDate === todayStr && availableDates.length > 1) {
      setScheduledDate(getLocalDateStr(availableDates[1]));
      return;
    }

    if (validSlots.length > 0) {
      if (!scheduledTime || !validSlots.includes(scheduledTime)) {
        setScheduledTime(validSlots[0]);
      }
    }
  }, [scheduledDate, scheduledTime, mounted]);

  // 4b. Compute estimated duration from cart items
  useEffect(() => {
    if (!mounted || cart.length === 0) return;
    // Fetch service durations for items in cart
    const fetchDurations = async () => {
      try {
        const res = await fetch(`/api/services/durations`);
        if (!res.ok) return;
        const services = await res.json();
        let total = 0;
        for (const item of cart) {
          // Companion bookings: duration comes from the chosen number of hours
          if (item.options?.hours) {
            total += item.options.hours * 60 * (item.quantity || 1);
            continue;
          }
          const svc = services.find((s: any) => s.id === item.id);
          if (svc) {
            const vd = svc.variant_durations || {};
            const variantDur = item.variantName ? vd[item.variantName] : null;
            total += (variantDur || svc.duration_minutes || 60) * (item.quantity || 1);
          } else {
            total += 60 * (item.quantity || 1);
          }
        }
        setEstimatedDuration(Math.max(total, 30));
      } catch { setEstimatedDuration(60); }
    };
    fetchDurations();
  }, [mounted, cart]);

  // 4c. Fetch dynamic slot availability when date or duration changes
  useEffect(() => {
    if (!scheduledDate || !mounted || estimatedDuration <= 0) return;
    const fetchAvailability = async () => {
      setAvailLoading(true);
      try {
        const bufferMins = 30; // system default
        const totalNeeded = estimatedDuration + bufferMins;
        const res = await fetch(`/api/availability?date=${scheduledDate}&duration_minutes=${totalNeeded}`);
        if (res.ok) {
          const data = await res.json();
          setSlotAvailability(data.slots || []);
        }
      } catch (err) {
        console.error('[Checkout] Availability fetch failed:', err);
        setSlotAvailability([]);
      }
      setAvailLoading(false);
    };
    fetchAvailability();
  }, [scheduledDate, estimatedDuration, mounted]);

  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const tax = 0; // 0% GST as requested
  const total = Math.max(0, subtotal + tax - discountAmt);

  const payments = [
    { id: 'cod', title: 'Cash After Service', desc: 'Pay after completion' },
  ];

  const applyCoupon = async () => {
    const code = couponCode.toUpperCase();
    if (!code) return;
    if (!user) {
      toast.error('Error', 'Please sign in to apply coupon.');
      return;
    }

    try {
      const res = await authFetch('/api/offers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotal: getCartTotal(),
          userId: user.id
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error('Invalid', errData.error || 'This coupon code is not valid.');
        return;
      }

      const data = await res.json();
      setDiscountAmt(data.discountAmt);
      toast.success('Applied!', `Coupon applied successfully! Saved ₹${data.discountAmt}`);
    } catch (err) {
      console.error('Coupon application failed:', err);
      toast.error('Error', 'Failed to validate coupon. Please try again.');
    }
  };

  // Auto-apply coupon carried over from cart page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('zarpit_coupon');
    if (!saved) return;

    const code = saved.trim().toUpperCase();
    setCouponCode(code);

    const autoApply = async () => {
      try {
        const { data: offer, error } = await supabase
          .from('offers')
          .select('*')
          .eq('code', code)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && offer) {
          const validTillDate = new Date(offer.valid_till);
          if (validTillDate >= new Date()) {
            if (!offer.usage_limit || offer.used_count < offer.usage_limit) {
              let discount = 0;
              const subtotal = getCartTotal();
              if (offer.discount_type === 'percent') {
                discount = Math.floor((subtotal * offer.discount_value) / 100);
                if (offer.max_discount) {
                  discount = Math.min(discount, offer.max_discount);
                }
              } else {
                discount = offer.discount_value;
              }
              setDiscountAmt(discount);
              toast.success('Applied!', `Saved ₹${discount} with coupon from your cart!`);
              return;
            }
          }
        }

        // Offline fallback
        const coupons: Record<string, { type: string; value: number; maxDiscount?: number }> = {
          'ZARPIT50': { type: 'percent', value: 50, maxDiscount: 500 },
          'CLEAN300': { type: 'flat', value: 300 },
          'CARE40': { type: 'percent', value: 40, maxDiscount: 400 },
          'REFER500': { type: 'flat', value: 500 },
        };
        const offlineResult = coupons[code];
        if (offlineResult) {
          const subtotal = getCartTotal();
          let discount = offlineResult.type === 'percent'
            ? Math.min(Math.floor(subtotal * offlineResult.value / 100), offlineResult.maxDiscount || Infinity)
            : offlineResult.value;
          setDiscountAmt(discount);
          toast.success('Applied!', `Saved ₹${discount} with coupon from your cart!`);
        }
      } catch (e) {
        console.error('Auto-apply coupon failed:', e);
      }
    };

    // Give it a tiny delay to ensure cart state has mounted and calculated subtotal
    const timer = setTimeout(autoApply, 600);
    return () => clearTimeout(timer);
  }, []);



  const handleAddAddress = async () => {
    if (!user || !newAddrText.trim()) {
      toast.error('Error', 'Please enter an address.');
      return;
    }
    const res = await authFetch('/api/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        label: newAddrLabel,
        full_address: newAddrText.trim(),
        house_no: houseNo.trim(),
        building_name: buildingName.trim(),
        landmark: landmark.trim(),
        latitude: userLat,
        longitude: userLng,
        city: 'Greater Noida',
      })
    });
    const data = await res.json();
    if (res.ok && data) {
      setAddresses([...addresses, data as Address]);
      setSelectedAddressId(data.id);
      setNewAddrText('');
      setShowAddAddress(false);
      toast.success('Saved', 'Address added.');
    } else {
      toast.error('Error', 'Failed to save address.');
    }
  };

  const handlePlaceOrder = async () => {
    // If not logged in, do smart user detection first
    if (!user) {
      // Validate contact fields
      if (!guestName.trim()) {
        toast.error('Name Required', 'Please enter your full name.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!guestEmail.trim() || !emailRegex.test(guestEmail)) {
        toast.error('Valid Email Required', 'Please enter a valid email address.');
        return;
      }
      if (!guestPhone || guestPhone.length < 10) {
        toast.error('Valid Phone Required', 'Please enter a valid 10-digit phone number.');
        return;
      }
      if (!selectedAddressId && !newAddrText) {
        toast.error('Address Required', 'Please select or search for an address.');
        return;
      }
      if (!scheduledDate || !scheduledTime) {
        toast.error('Schedule Required', 'Please select a date and time slot.');
        return;
      }

      // Save all checkout state to localStorage
      localStorage.setItem('zarpit_pending_checkout', JSON.stringify({
        guestName, guestPhone, guestEmail,
        address: newAddrText, addressLabel: newAddrLabel,
        lat: userLat, lng: userLng,
        scheduledDate, scheduledTime, instructions
      }));

      // Check if user exists via secure backend API
      setAuthChecking(true);
      setAuthFeedback({ type: 'info', msg: 'Checking your account...' });

      try {
        const res = await fetch('/api/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: guestEmail.trim().toLowerCase() })
        });

        if (!res.ok) throw new Error('Server error');
        const { exists } = await res.json();

        if (exists) {
          setAuthFeedback({ type: 'success', msg: 'Account found! Redirecting to login...' });
          setTimeout(() => {
            window.location.href = `/auth?mode=login&redirect=/checkout&email=${encodeURIComponent(guestEmail)}`;
          }, 2000);
        } else {
          setAuthFeedback({ type: 'info', msg: 'No account found. Redirecting to sign up...' });
          setTimeout(() => {
            window.location.href = `/auth?mode=signup&redirect=/checkout&email=${encodeURIComponent(guestEmail)}&name=${encodeURIComponent(guestName)}&phone=${encodeURIComponent(guestPhone)}`;
          }, 2000);
        }
      } catch (err) {
        setAuthFeedback({ type: 'error', msg: 'Could not verify account. Please try again.' });
        setAuthChecking(false);
      }
      return;
    }

    // --- Logged-in user flow ---
    if (!profile?.phone) {
      toast.error('Phone Required', 'Please add your phone number in Profile settings.');
      setTimeout(() => (window.location.href = '/profile?tab=profile'), 2000);
      return;
    }
    if (!selectedAddressId && (!newAddrText || !houseNo.trim() || !buildingName.trim())) {
      toast.error('Details Required', 'Please enter House No. and Building/Floor details.');
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      toast.error('Schedule Required', 'Please select a date and time slot.');
      return;
    }

    // Strict Serviceability Check
    if (!isCurrentLocationServiceable) {
      toast.error('Location Not Serviceable', 'Please choose a serviceable location to continue.');
      return;
    }

    // Verify slot availability
    const avail = slotAvailability.find(s => s.time === scheduledTime);
    if (avail && !avail.available) {
      toast.error('Slot Unavailable', 'The selected time slot is no longer available. Please choose another.');
      return;
    }

    if (!selectedPayment) {
      toast.error('Payment Method', 'Please select a payment method.');
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (selectedPayment === 'online') {
      try {
        setProcessing(true);
        // Create order
        const resOrder = await authFetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart, couponCode: couponCode || undefined, userId: user.id }),
        });
        
        const orderData = await resOrder.json();
        if (!resOrder.ok) throw new Error(orderData.error || 'Failed to initialize payment');

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Zarpit',
          description: 'Home Services Booking',
          image: '/images/zarpit-icon.png',
          order_id: orderData.id,
          handler: async function (response: any) {
            await submitBooking({
               paymentMethod: 'Online (Razorpay)',
               razorpayPaymentId: response.razorpay_payment_id,
               razorpayOrderId: response.razorpay_order_id,
               razorpaySignature: response.razorpay_signature
            });
          },
          prefill: {
            name: profile?.full_name || guestName || user?.user_metadata?.full_name || '',
            email: user?.email || guestEmail,
            contact: profile?.phone || guestPhone || user?.phone || '',
          },
          theme: {
            color: '#FF6B00',
          },
          modal: {
            ondismiss: function() {
              setProcessing(false);
              toast.info('Payment Cancelled', 'You cancelled the payment.');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any){
          setProcessing(false);
          toast.error('Payment Failed', response.error.description);
        });
        rzp.open();
        return;
      } catch(err: any) {
        setProcessing(false);
        toast.error('Error', err.message);
        return;
      }
    } else {
      await submitBooking({ paymentMethod: 'Pay After Service' });
    }
  };

  const submitBooking = async (paymentDetails: any) => {
    setProcessing(true);
    let finalAddressId = selectedAddressId;

    try {
      // If new address details are entered and not saved yet, save them now
      if (!finalAddressId && user) {
        const addrRes = await authFetch('/api/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            label: newAddrLabel,
            full_address: newAddrText,
            house_no: houseNo.trim(),
            building_name: buildingName.trim(),
            landmark: landmark.trim(),
            latitude: userLat,
            longitude: userLng,
            city: 'Greater Noida'
          })
        });
        if (addrRes.ok) {
          const savedAddr = await addrRes.json();
          finalAddressId = savedAddr.id;
          // Refresh local addresses
          setAddresses(prev => [...prev, savedAddr]);
          setSelectedAddressId(savedAddr.id);
        } else {
          const errorData = await addrRes.json();
          console.error('[Checkout] Address save failed:', errorData.error);
          toast.error('Address Save Failed', errorData.error || 'Could not save address to your profile.');
          // We continue anyway so the order isn't blocked
        }
      }

      const selectedAddr = addresses.find(a => a.id === finalAddressId) || (finalAddressId === selectedAddressId ? addresses.find(a => a.id === selectedAddressId) : null);
      
      const finalAddress = selectedAddr
        ? `${selectedAddr.label}: ${selectedAddr.house_no ? `${selectedAddr.house_no}, ` : ''}${selectedAddr.building_name ? `${selectedAddr.building_name}, ` : ''}${selectedAddr.full_address}${selectedAddr.landmark ? ` (Landmark: ${selectedAddr.landmark})` : ''}`
        : `${newAddrLabel}: ${houseNo.trim()}, ${buildingName.trim()}, ${newAddrText}${landmark.trim() ? ` (Landmark: ${landmark.trim()})` : ''}`;

      // Attach Companion / Helping Buddy booking options (hours, persons, gender, meet point, need)
      // to the order instructions so they reach the admin panel & Telegram notification
      const optionSummaries = cart
        .filter(i => i.options)
        .map(i => `[${i.name}] ${formatOptionsSummary(i.options).join(' | ')}`);
      const finalInstructions = [instructions.trim(), ...optionSummaries].filter(Boolean).join('\n');

      const res = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          cart,
          subtotal,
          tax,
          discount: savings + discountAmt,
          couponCode: discountAmt > 0 ? couponCode.toUpperCase() : null,
          total,
          scheduledDate,
          scheduledTime,
          address: finalAddress,
          instructions: finalInstructions,
          newAddrLabel,
          newAddrText,
          userLat,
          userLng,
          selectedAddressId: finalAddressId,
          ...paymentDetails
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to place order');

      const bookingId = result.bookingId;
      const bookingNumber = result.bookingNumber;
      // Send notification (non-blocking) if user exists
      if (user && user.id) {
        sendNotification(user.id, 'Booking Received!', `Booking #${bookingNumber} placed successfully.`, 'booking', { booking_id: bookingId });
      }

      // Attempt auto-assignment to a salaried worker
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          await fetch('/api/admin/assign-task', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bookingId: bookingId })
          });
        }
      } catch (e) {
        console.error('Failed to auto-assign:', e);
      }

      clearCart();
      localStorage.removeItem('zarpit_pending_checkout');
      window.location.href = `/confirmation?id=${bookingId}`;
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Order Failed', err?.message || 'Something went wrong');
      setProcessing(false);
    }
  };

  if (cart.length === 0 && mounted) {
    return <><Navbar /><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',paddingTop:'var(--navbar-h)'}}><div style={{textAlign:'center'}}><div style={{marginBottom:16,display:'flex',justifyContent:'center'}}><ShoppingCart size={64} style={{color:'var(--text-muted)'}} /></div><h2 style={{fontFamily:'var(--font-heading)',marginBottom:8}}>Cart is empty</h2><Link href="/services" className="btn btn-primary">Browse Services</Link></div></div></>;
  }

  // Determine if the currently active location is serviceable based strictly on coordinates or session status
  const selectedSavedAddress = addresses.find(a => a.id === selectedAddressId);
  const activeLat = selectedAddressId && selectedSavedAddress ? selectedSavedAddress.latitude : userLat;
  const activeLng = selectedAddressId && selectedSavedAddress ? selectedSavedAddress.longitude : userLng;
  const activeAddressText = selectedAddressId && selectedSavedAddress ? selectedSavedAddress.full_address : newAddrText;

  const isCurrentLocationServiceable = activeLat && activeLng 
    ? isLocationServiceable(activeLat, activeLng, activeAreas.length > 0 ? activeAreas : undefined).serviceable 
    : (locationStatus === 'serviceable' || !activeAddressText);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Navbar />
      <ToastContainer />
      <div style={{paddingTop:'calc(var(--navbar-h) + 40px)',paddingBottom:100,background:'var(--bg-light)',minHeight:'100vh', transition: 'background 0.3s ease', overflowX: 'hidden'}}>
        {!mounted ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="container" style={{maxWidth:1100, margin: '0 auto'}}>
            <style>{`
              .checkout-layout {
                display: grid;
                grid-template-columns: 1.25fr 1fr;
                gap: 32px;
                align-items: start;
              }
              .address-buttons-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
              }
              .checkout-sidebar {
                position: sticky;
                top: calc(var(--navbar-h) + 32px);
              }
              .checkout-section {
                padding: 32px;
                background: var(--bg-card-solid);
                border-radius: 24px;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--glass-border);
                backdrop-filter: blur(20px);
              }

              @media (max-width: 900px) {
                .checkout-layout {
                  grid-template-columns: 1fr !important;
                  gap: 24px !important;
                }
                .address-buttons-grid {
                  grid-template-columns: 1fr !important;
                }
                .checkout-sidebar {
                  position: static !important;
                  margin-top: 24px;
                }
                .checkout-section {
                  padding: 20px !important;
                }
                .checkout-header h1 {
                  font-size: 1.75rem !important;
                }
                .summary-item-name {
                  max-width: 140px;
                }
              }
              
              /* Force zero overflow */
              body, html, #__next {
                overflow-x: hidden !important;
                max-width: 100vw !important;
              }
            `}</style>

          
          <div className="checkout-header" style={{display:'flex',flexDirection:'column',gap:8,marginBottom:40}}>
            <h1 style={{fontFamily:'var(--font-heading)',fontSize:'2.25rem',fontWeight:800,letterSpacing:'-0.03em', color: 'var(--text)'}}>Checkout</h1>
            <p style={{color:'var(--text-secondary)',fontSize:15}}>Secure and hassle-free booking for your home services</p>
          </div>

          <div className="checkout-layout">
            
            <div style={{display:'flex',flexDirection:'column',gap:24, minWidth: 0}}>
              
              {/* 1. Contact Details */}
              <section className="checkout-section">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
                  <div style={{width:40,height:40,borderRadius:12,background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}><Smartphone size={20}/></div>
                  <div>
                    <h3 style={{fontSize:18,fontWeight:700, color: 'var(--text)'}}>Contact Details</h3>
                    <p style={{fontSize:13,color:'var(--text-muted)'}}>We'll send booking updates to this number</p>
                  </div>
                </div>

                {authLoading ? (
                  <div style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',background:'var(--bg-input)',borderRadius:16,border:'1px solid var(--border-light)', animation: 'pulse 1.5s infinite'}}>
                    <div style={{flex:1}}>
                      <div style={{height:18,width:140,background:'var(--border-light)',borderRadius:4,marginBottom:8}} />
                      <div style={{height:14,width:100,background:'var(--border-light)',borderRadius:4}} />
                    </div>
                  </div>
                ) : user ? (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',background:'var(--bg-input)',borderRadius:16,border:'1px solid var(--border-light)'}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:600, color: 'var(--text)'}}>{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'}</div>
                      <div style={{fontSize:13,color:'var(--text-secondary)', marginTop: 2}}>{profile?.phone || user?.phone || ''}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)', wordBreak: 'break-all'}}>{user?.email}</div>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:'var(--success)',background:'rgba(34,197,94,0.1)',padding:'4px 10px',borderRadius:8}}>LOGGED IN</span>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:16}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <label style={{fontSize:13,fontWeight:600}}>Full Name <span style={{color:'var(--error)'}}>*</span></label>
                        <input className="input" placeholder="Enter your name" value={guestName} onChange={e=>setGuestName(e.target.value)} style={{background:'var(--surface)',height:50,borderRadius:12}} />
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <label style={{fontSize:13,fontWeight:600, color: 'var(--text)'}}>Phone Number <span style={{color:'var(--error)'}}>*</span></label>
                        <div style={{display:'flex',gap:8}}>
                          <span style={{height:50,padding:'0 12px',background:'var(--bg-input)',borderRadius:12,display:'flex',alignItems:'center',fontSize:13,fontWeight:700,color:'var(--text-muted)', border: '1px solid var(--border-light)'}}>+91</span>
                          <input className="input" type="tel" placeholder="98765 43210" maxLength={10} value={guestPhone} onChange={e=>setGuestPhone(e.target.value.replace(/\D/g, ''))} style={{background:'var(--bg-input)',height:50,borderRadius:12,flex:1}} />
                        </div>
                        {guestPhone && guestPhone.length < 10 && <span style={{fontSize:11,color:'var(--error)',fontWeight:600}}>Please enter a valid 10-digit number</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      <label style={{fontSize:13,fontWeight:600}}>Email Address <span style={{color:'var(--error)'}}>*</span></label>
                      <div style={{position:'relative'}}>
                        <div style={{position:'absolute',left:14,top:15,color:'var(--text-muted)'}}><Mail size={16}/></div>
                        <input className="input" type="email" placeholder="you@example.com" value={guestEmail} onChange={e=>setGuestEmail(e.target.value)} style={{background:'var(--surface)',height:50,borderRadius:12,paddingLeft:40}} />
                      </div>
                      {guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) && <span style={{fontSize:11,color:'var(--error)',fontWeight:600}}>Please enter a valid email address</span>}
                    </div>

                    {/* Auth Feedback Banner */}
                    {authFeedback && (
                      <div style={{
                        padding:'14px 18px',borderRadius:14,display:'flex',alignItems:'center',gap:12,
                        background: authFeedback.type === 'success' ? 'rgba(34,197,94,0.08)' : authFeedback.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(255,107,0,0.06)',
                        border: `1px solid ${authFeedback.type === 'success' ? 'rgba(34,197,94,0.2)' : authFeedback.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,107,0,0.15)'}`,
                      }}>
                        {authChecking && <Loader2 size={16} style={{color:'var(--accent)',animation:'spin 1s linear infinite'}} />}
                        {authFeedback.type === 'success' && <CheckCircle2 size={16} style={{color:'var(--success)'}} />}
                        {authFeedback.type === 'error' && <AlertCircle size={16} style={{color:'var(--error)'}} />}
                        <span style={{fontSize:13,fontWeight:600,color: authFeedback.type === 'success' ? 'var(--success)' : authFeedback.type === 'error' ? 'var(--error)' : 'var(--accent)'}}>{authFeedback.msg}</span>
                        {authFeedback.type === 'error' && (
                          <button onClick={() => { setAuthFeedback(null); setAuthChecking(false); }} style={{marginLeft:'auto',background:'none',border:'none',color:'var(--accent)',fontSize:12,fontWeight:700,cursor:'pointer',textDecoration:'underline'}}>Retry</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 2. Address */}
              <section className="checkout-section">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:40,height:40,borderRadius:12,background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}><MapPin size={20}/></div>
                    <h3 style={{fontSize:18,fontWeight:700, color: 'var(--text)'}}>Service Address</h3>
                  </div>
                </div>

                {!isCurrentLocationServiceable && (
                  <div style={{padding:'16px 20px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:16,marginBottom:24,display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--error)'}}>
                      <AlertCircle size={20}/>
                      <span style={{fontSize:15,fontWeight:700}}>Location Not Serviceable</span>
                    </div>
                    <p style={{fontSize:13,color:'var(--error)',lineHeight:1.5}}>
                      Please choose another location. Our services don't work in your area yet, but we are planning to expand soon!
                    </p>
                    <p style={{fontSize:13,color:'var(--error)',fontWeight:600}}>
                      Currently serving: {activeAreas.length > 0 ? activeAreas.map((a: any) => a.name).join(', ') : 'our specific service zones'}.
                    </p>
                  </div>
                )}

                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  {/* Address Search */}
                  <div style={{position:'relative'}}>
                    <div style={{position:'absolute',left:16,top:16,color:'var(--text-muted)'}}><Search size={18}/></div>
                    <input className="input" placeholder="Search for your building, street or area..." value={addressSearch} onChange={e=>handleSearchChange(e.target.value)} style={{paddingLeft:48,height:52,borderRadius:16,background:'var(--bg-input)'}} />
                    {addressSearch && <button onClick={()=>{setAddressSearch('');setPredictions([]);}} style={{position:'absolute',right:16,top:16,border:'none',background:'none',color:'var(--text-muted)',cursor:'pointer'}}><X size={18}/></button>}
                    
                    {predictions.length > 0 && (
                      <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,background:'var(--bg-elevated)',borderRadius:16,boxShadow:'0 10px 40px rgba(0,0,0,0.25)',border:'1px solid var(--border)',zIndex:100,overflow:'hidden'}}>
                        {predictions.map(p => (
                          <div key={p.place_id} onClick={() => selectPrediction(p)} style={{padding:'14px 20px',borderBottom:'1px solid var(--border-light)',cursor:'pointer',transition:'background 0.2s'}} className="prediction-item">
                            <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{p.structured_formatting.main_text}</div>
                            <div style={{fontSize:12,color:'var(--text-muted)'}}>{p.structured_formatting.secondary_text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="address-buttons-grid">
                    <button onClick={detectLocation} disabled={locationStatus === 'detecting'} className="btn btn-secondary" style={{height:52,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'var(--bg-input)',border:'1px solid var(--border-light)', opacity: locationStatus === 'detecting' ? 0.7 : 1}}>
                      {locationStatus === 'detecting' ? (
                        <Loader2 size={18} className="animate-spin" style={{color:'var(--accent)'}}/>
                      ) : (
                        <Target size={18} style={{color:'var(--accent)'}}/>
                      )}
                      {locationStatus === 'detecting' ? 'Detecting...' : 'Use current location'}
                    </button>
                    <button onClick={() => setShowMapPicker(true)} className="btn btn-secondary" style={{height:52,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'var(--bg-input)',border:'1px solid var(--border-light)'}}>
                      <MapIcon size={18} style={{color:'var(--accent)'}}/> Pick on map
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 16,
                    overflowX: 'auto',
                    paddingBottom: 10,
                    paddingRight: 10,
                    margin: '0 -4px',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }} className="hide-scrollbar">
                    {addresses.map(a => (
                      <div key={a.id} onClick={() => setSelectedAddressId(a.id)} style={{
                        display:'flex',alignItems:'flex-start',gap:12,padding:'16px',border: `1.5px solid ${selectedAddressId === a.id ? 'var(--accent)' : 'var(--border-light)'}`,
                        borderRadius:20,cursor:'pointer',transition:'all 0.2s',
                        background: selectedAddressId === a.id ? 'rgba(255,107,0,0.05)' : 'var(--bg-card-solid)',
                        minWidth: 280, maxWidth: 280, flexShrink: 0,
                        boxShadow: selectedAddressId === a.id ? '0 10px 20px rgba(255,107,0,0.1)' : 'none'
                      }}>
                        <div style={{width:18,height:18,borderRadius:9,border: `2px solid ${selectedAddressId === a.id ? 'var(--accent)' : 'var(--border)'}`,flexShrink:0,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {selectedAddressId === a.id && <div style={{width:8,height:8,borderRadius:4,background:'var(--accent)'}} />}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',flexDirection:'column',gap:2}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
                              <span style={{fontSize:14,fontWeight:800,color:'var(--text)'}}>{a.label}</span>
                              {a.is_default && <span style={{fontSize:9,fontWeight:800,color:'var(--accent)',background:'var(--accent-light)',padding:'2px 6px',borderRadius:6}}>DEFAULT</span>}
                            </div>
                            {(a.house_no || a.building_name) && (
                              <div style={{fontSize:12,fontWeight:700,color:'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                {a.house_no}{a.house_no && a.building_name ? ', ' : ''}{a.building_name}
                              </div>
                            )}
                            <p style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.4, height: 34, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                              {a.full_address}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {newAddrText && showAddAddress && (
                    <div 
                      onClick={() => setSelectedAddressId(null)}
                      style={{
                        padding:24,
                        background: selectedAddressId === null ? 'rgba(255,107,0,0.03)' : 'var(--bg-input)',
                        borderRadius:20,
                        border: `1.5px solid ${selectedAddressId === null ? 'var(--accent)' : 'var(--border-light)'}`,
                        display:'flex',flexDirection:'column',gap:16,
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:20,height:20,borderRadius:10,border: `2px solid ${selectedAddressId === null ? 'var(--accent)' : 'var(--border)'}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {selectedAddressId === null && <div style={{width:10,height:10,borderRadius:5,background:'var(--accent)'}} />}
                        </div>
                        <MapPin size={18} style={{color: selectedAddressId === null ? 'var(--accent)' : 'var(--text-secondary)'}} />
                        <span style={{fontSize:14,fontWeight:700, color: selectedAddressId === null ? 'var(--text)' : 'var(--text-secondary)'}}>Selected Location</span>
                      </div>
                      <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6, paddingLeft: 30}}>{newAddrText}</p>
                      
                      {selectedAddressId === null && (
                        <>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, paddingLeft: 30}}>
                            <div style={{display:'flex', flexDirection:'column', gap:6}}>
                              <label style={{fontSize:11, fontWeight:700, color:'var(--text-secondary)'}}>House / Flat No. <span style={{color:'var(--error)'}}>*</span></label>
                              <input className="input" placeholder="e.g. A-12" value={houseNo} onChange={e=>setHouseNo(e.target.value)} style={{height:40, borderRadius:10, fontSize:13, background:'var(--surface)', border:'1px solid var(--border-light)'}} />
                            </div>
                            <div style={{display:'flex', flexDirection:'column', gap:6}}>
                              <label style={{fontSize:11, fontWeight:700, color:'var(--text-secondary)'}}>Building / Floor <span style={{color:'var(--error)'}}>*</span></label>
                              <input className="input" placeholder="e.g. Hemgiri Apts" value={buildingName} onChange={e=>setBuildingName(e.target.value)} style={{height:40, borderRadius:10, fontSize:13, background:'var(--surface)', border:'1px solid var(--border-light)'}} />
                            </div>
                          </div>
                          <div style={{display:'flex', flexDirection:'column', gap:6, paddingLeft: 30}}>
                            <label style={{fontSize:11, fontWeight:700, color:'var(--text-secondary)'}}>Landmark (Optional)</label>
                            <input className="input" placeholder="e.g. Near HDFC Bank" value={landmark} onChange={e=>setLandmark(e.target.value)} style={{height:40, borderRadius:10, fontSize:13, background:'var(--surface)', border:'1px solid var(--border-light)'}} />
                          </div>
                          <div style={{display:'flex',gap:10, paddingLeft: 30}}>
                            {['Home', 'Office', 'Other'].map(l => (
                              <button key={l} onClick={(e) => { e.stopPropagation(); setNewAddrLabel(l); }} style={{
                                padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, border: `1.5px solid ${newAddrLabel === l ? 'var(--accent)' : 'var(--border)'}`,
                                background: newAddrLabel === l ? 'var(--accent)' : 'var(--bg-input)', 
                                color: newAddrLabel === l ? '#fff' : 'var(--text-secondary)',
                                transition: 'all 0.2s', cursor: 'pointer'
                              }}>{l}</button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* 3. Schedule */}
              <section className="checkout-section">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
                  <div style={{width:40,height:40,borderRadius:12,background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}><Clock size={20}/></div>
                  <h3 style={{fontSize:18,fontWeight:700, color: 'var(--text)'}}>Select Date & Time</h3>
                </div>

                <div style={{position:'relative'}}>
                  {/* Back Arrow Button */}
                  {canScrollLeft && (
                    <div 
                      onClick={() => scrollDates('left')}
                      style={{
                        position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
                        width: 44, height: 44, borderRadius: 22, background: 'var(--white)', 
                        border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        cursor: 'pointer', zIndex: 10, color: 'var(--accent)'
                      }}
                    >
                      <ChevronLeft size={24} strokeWidth={3} />
                    </div>
                  )}

                  <div 
                    ref={dateScrollRef}
                    onScroll={checkScroll}
                    style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:12,marginBottom:24, scrollSnapType: 'x mandatory'}} 
                    className="no-scrollbar"
                  >
                  {availableDates.map(d => {
                    const dateStr = getLocalDateStr(d);
                    const slots = getValidSlots(dateStr);
                    const isAvailable = slots.length > 0;
                    const isSelected = scheduledDate === dateStr;
                    const todayStr = getLocalDateStr(new Date());
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = d.getDate();
                    return (
                      <div key={dateStr} onClick={() => isAvailable && setScheduledDate(dateStr)} style={{
                        minWidth: 80, padding: '16px 0', borderRadius: 16, textAlign: 'center', cursor: isAvailable ? 'pointer' : 'not-allowed', transition: 'all 0.2s', flexShrink: 0,
                        scrollSnapAlign: 'start',
                        background: isSelected ? 'var(--accent)' : 'var(--bg-input)', 
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-light)'}`,
                        color: isSelected ? '#fff' : 'var(--text)',
                        opacity: isAvailable ? 1 : 0.4,
                      }}>
                        <div style={{fontSize: 11, fontWeight:600, textTransform: 'uppercase', opacity: isSelected ? 0.7 : 0.5}}>{dayName}</div>
                        <div style={{fontSize: 20, fontWeight: 800, margin:'4px 0'}}>{dayNum}</div>
                        {!isAvailable && <div style={{fontSize: 9, fontWeight: 800, color: 'var(--error)'}}>SOLD OUT</div>}
                      </div>
                    );
                  })}
                  </div>
                  {/* Next Arrow Button */}
                  {canScrollRight && (
                    <div 
                      onClick={() => scrollDates('right')}
                      style={{
                        position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)',
                        width: 44, height: 44, borderRadius: 22, background: 'var(--white)', 
                        border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        cursor: 'pointer', zIndex: 10, color: 'var(--accent)'
                      }}
                    >
                      <ChevronRight size={24} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))',gap:12}}>
                  {(() => {
                    const slots = getValidSlots(scheduledDate);
                    const todayStr = getLocalDateStr(new Date());
                    if (slots.length === 0) return (
                      <div style={{gridColumn:'1/-1',padding:24,background:'var(--surface)',borderRadius:16,textAlign:'center'}}>
                        <p style={{fontSize:14,color:'var(--error)',fontWeight:600}}>All slots are over for today</p>
                        <p style={{fontSize:12,color:'var(--text-muted)'}}>Please select another date to continue.</p>
                      </div>
                    );
                    return slots.map((t, idx) => {
                      const isSelected = scheduledTime === t;
                      // Check dynamic availability
                      const avail = slotAvailability.find(s => s.time === t);
                      const isSold = avail ? !avail.available : false;
                      
                      return (
                        <div key={t} onClick={() => !isSold && setScheduledTime(t)} style={{
                          padding: '14px', borderRadius: 12, textAlign: 'center', 
                          cursor: isSold ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                          background: isSold ? 'rgba(239,68,68,0.04)' : isSelected ? 'rgba(255,107,0,0.1)' : 'var(--bg-input)', 
                          border: `1.5px solid ${isSold ? 'rgba(239,68,68,0.2)' : isSelected ? 'var(--accent)' : 'var(--border-light)'}`,
                          color: isSold ? 'var(--text-muted)' : isSelected ? 'var(--accent)' : 'var(--text)',
                          fontWeight: 700, fontSize: 13, position:'relative',
                          opacity: isSold ? 0.5 : 1,
                        }}>
                          {idx === 0 && scheduledDate === todayStr && !isSold && (
                            <span style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:'var(--success)',color:'#fff',fontSize:8,padding:'2px 6px',borderRadius:4,whiteSpace:'nowrap'}}>EARLIEST</span>
                          )}
                          {isSold && (
                            <span style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:'var(--error)',color:'#fff',fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:4,whiteSpace:'nowrap'}}>SOLD</span>
                          )}
                          {t}
                        </div>
                      );
                    });
                  })()}
                </div>
                
                {/* Duration & availability info */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:20,padding:'10px 14px',background:'rgba(255,107,0,0.05)',borderRadius:10,border:'1px solid rgba(255,107,0,0.1)'}}>
                  <Clock size={14} style={{color:'var(--accent)'}} />
                  <span style={{fontSize:12,color:'var(--accent)',fontWeight:600}}>Est. duration: {estimatedDuration} mins (+30 min buffer) · {slotAvailability.filter(s => s.available).length} slots available</span>
                </div>
              </section>

              {/* 4. Payment */}
              <section id="payment-section" className="checkout-section">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
                  <div style={{width:40,height:40,borderRadius:12,background:'var(--accent-light)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}><CreditCard size={20}/></div>
                  <h3 style={{fontSize:18,fontWeight:700, color: 'var(--text)'}}>Payment Method</h3>
                </div>
                
                <div style={{display:'grid',gap:12}}>
                  {[
                    { id: 'online', title: 'Pay Now (Razorpay)', desc: 'Credit/Debit, UPI, NetBanking', icon: CreditCard },
                    { id: 'cod', title: 'Pay After Service', desc: 'Pay securely after the job is done', icon: Wallet }
                  ].map(method => (
                    <div 
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      style={{
                        display:'flex',alignItems:'center',gap:16,padding:'18px 20px',
                        border: `1.5px solid ${selectedPayment === method.id ? 'var(--accent)' : 'var(--border-light)'}`,
                        borderRadius:16,cursor:'pointer',
                        background: selectedPayment === method.id ? 'rgba(255,107,0,0.02)' : 'var(--surface)',
                        transition: 'all 0.2s'
                      }}>
                      <div style={{color: selectedPayment === method.id ? 'var(--accent)' : 'var(--text-muted)'}}>
                        <method.icon size={20}/>
                      </div>
                      <div style={{flex:1}}>
                        <h4 style={{fontSize:15,fontWeight:700, color: selectedPayment === method.id ? 'var(--accent)' : 'var(--text)'}}>{method.title}</h4>
                        <p style={{fontSize:12,color:'var(--text-muted)'}}>{method.desc}</p>
                      </div>
                      <div style={{width:20,height:20,borderRadius:10,border:`2px solid ${selectedPayment === method.id ? 'var(--accent)' : 'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center', transition: 'all 0.2s'}}>
                        {selectedPayment === method.id && <div style={{width:10,height:10,borderRadius:5,background:'var(--accent)'}} />}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Sidebar Summary */}
            <aside className="checkout-sidebar">
              <div className="checkout-section">
                <h3 style={{fontSize:18,fontWeight:800,marginBottom:24, color: 'var(--text)'}}>Order Summary</h3>
                
                <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:24}}>
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span className="summary-item-name" style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{item.name}</span>
                          <span style={{fontSize:14,fontWeight:700, flexShrink: 0}}>{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>

                <div style={{padding:'16px 0',borderTop:'1px dashed var(--border)',borderBottom:'1px dashed var(--border)',marginBottom:24}}>
                  <div style={{display:'flex',gap:10}}>
                    <input className="input" placeholder="Apply Coupon" value={couponCode} onChange={e=>setCouponCode(e.target.value)} style={{flex:1,height:44,background:'var(--surface)',fontSize:13}} />
                    <button onClick={applyCoupon} style={{padding:'0 20px',borderRadius:10,background:'var(--black)',color:'#fff',fontWeight:700,fontSize:13,border:'none',cursor:'pointer'}}>Apply</button>
                  </div>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-secondary)'}}><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  {savings > 0 && <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--success)',fontWeight:600}}><span>Savings</span><span>-{formatPrice(savings)}</span></div>}
                  {discountAmt > 0 && <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--success)',fontWeight:600}}><span>Coupon</span><span>-{formatPrice(discountAmt)}</span></div>}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-secondary)'}}><span>Tax & Fee</span><span>{formatPrice(tax)}</span></div>
                </div>
                
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:24,paddingTop:24,borderTop:'1px dashed var(--border-light)'}}>
                  <span style={{fontSize:18,fontWeight:800, color: 'var(--text)'}}>Total</span>
                  <span style={{fontSize:24,fontWeight:900,color:'var(--text)',letterSpacing:'-0.03em'}}>{formatPrice(total)}</span>
                </div>

                <button 
                  className="btn btn-primary btn-lg" 
                  style={{width:'100%',marginTop:32,borderRadius:16,fontSize:16,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 8px 24px rgba(255,107,0,0.25)', opacity: !isCurrentLocationServiceable ? 0.5 : 1, cursor: !isCurrentLocationServiceable ? 'not-allowed' : 'pointer'}}
                  onClick={handlePlaceOrder}
                  disabled={processing || !isCurrentLocationServiceable}
                >
                  {processing ? <Loader2 size={20} className="animate-spin" /> : 'Place Order'}
                </button>

                {!isCurrentLocationServiceable && (
                  <p style={{fontSize:12,color:'var(--error)',textAlign:'center',marginTop:12,fontWeight:600}}>
                    Please select a serviceable location to continue.
                  </p>
                )}

                <div style={{marginTop:24,display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--text-secondary)',fontSize:12}}>
                    <ShieldCheck size={16} style={{color:'var(--success)'}}/> <span>Secure checkout • Verified Experts</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--text-secondary)',fontSize:12}}>
                    <CheckCircle2 size={16} style={{color:'var(--success)'}}/> <span>Free cancellation up to 45 mins before</span>
                  </div>
                </div>
              </div>

              <div style={{marginTop:20,padding:'16px 20px',background:'var(--accent-light)',borderRadius:20,border:'1px solid var(--accent-border)',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:8,height:8,borderRadius:4,background:'var(--accent)'}} className="pulse" />
                <span style={{fontSize:12,color:'var(--accent)',fontWeight:700}}>{viewerCount} people are looking at these slots right now</span>
              </div>
            </aside>

          </div>
        </div>
        )}
      </div>


      {/* Map Picker Modal */}
      {showMapPicker && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:20, backdropFilter: 'blur(10px)'}}>
          <div style={{background:'var(--bg-card-solid)',width:'100%',maxWidth:800,height:'90vh',borderRadius:32,overflow:'hidden',display:'flex',flexDirection:'column',position:'relative', border: '1px solid var(--glass-border)'}}>
            <div style={{padding:'20px 32px',borderBottom:'1px solid var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <h3 style={{fontSize:18,fontWeight:800, color: 'var(--text)'}}>Select location</h3>
                <p style={{fontSize:12,color:'var(--text-muted)'}}>Drag the map to move the pin to your exact location</p>
              </div>
              <button onClick={()=>setShowMapPicker(false)} style={{width:40,height:40,borderRadius:20,background:'var(--bg-input)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer', color: 'var(--text)'}}><X size={20}/></button>
            </div>
            
            <div style={{flex:1,position:'relative'}}>
              <div ref={mapRef} style={{width:'100%',height:'100%'}} />
              {/* Center Pin */}
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%, -100%)',pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{background:'var(--accent)',color:'#fff',padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:700,marginBottom:4,boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>Services available here</div>
                <MapPin size={40} style={{color:'var(--accent)',fill:'rgba(255,107,0,0.2)'}} />
                <div style={{width:8,height:4,background:'rgba(0,0,0,0.2)',borderRadius:'50%',marginTop:1,filter:'blur(1px)'}} />
              </div>
            </div>

            <div style={{padding:32,background:'#fff',borderTop:'1px solid #eee'}}>
              <button className="btn btn-primary" style={{width:'100%',height:56,fontSize:16,fontWeight:800,borderRadius:16}} onClick={confirmMapLocation}>Confirm Location</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pulse { animation: pulse 2s infinite; }
        .prediction-item:hover { background: #f8f9fa; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 107, 0, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 107, 0, 0); }
        }
        @media (max-width: 992px) {
          .checkout-layout { grid-template-columns: 1fr !important; }
          aside { position: static !important; }
        }
      `}</style>
    </>
  );
}
