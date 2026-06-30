"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Store, Teacher, Service, mockUser } from "./mockData";

const SESSION_KEY = "fascia_booking_state";

function loadFromSession(): Partial<BookingState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Restore Date object from ISO string
    if (parsed.selectedDate) {
      parsed.selectedDate = new Date(parsed.selectedDate);
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveToSession(state: BookingState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {}
}

export interface BookingState {
  // User
  user: typeof mockUser | null;
  isLoggedIn: boolean;
  isNewUser: boolean;
  consentSigned: boolean;

  // Booking selections
  selectedStore: Store | null;
  selectedTeacher: Teacher | null;
  selectedService: Service | null;
  selectedServices: Service[];
  hasAddon: boolean;
  selectedDate: Date | null;
  selectedTime: string | null;
  notes: string;

  // Step tracking
  currentStep: number;
}

interface BookingContextType {
  state: BookingState;
  setUser: (user: typeof mockUser | null) => void;
  setLoggedIn: (val: boolean) => void;
  setConsentSigned: (val: boolean) => void;
  setSelectedStore: (store: Store | null) => void;
  setSelectedTeacher: (teacher: Teacher | null) => void;
  setSelectedService: (service: Service | null) => void;
  setSelectedServices: (services: Service[]) => void;
  setHasAddon: (val: boolean) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;
  setNotes: (notes: string) => void;
  setCurrentStep: (step: number) => void;
  resetBooking: () => void;
  getTotalPrice: () => number;
}

const initialState: BookingState = {
  user: null,
  isLoggedIn: false,
  isNewUser: false,
  consentSigned: false,
  selectedStore: null,
  selectedTeacher: null,
  selectedService: null,
  selectedServices: [],
  hasAddon: false,
  selectedDate: null,
  selectedTime: null,
  notes: "",
  currentStep: 0,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(() => ({
    ...initialState,
    ...loadFromSession(),
  }));

  useEffect(() => {
    saveToSession(state);
  }, [state]);

  const update = (partial: Partial<BookingState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const getTotalPrice = () => {
    if (!state.selectedTeacher) return 0;
    const isMember = state.user?.isMember || false;
    const isFirstTime = state.user?.isNewUser || false;
    const level = state.selectedTeacher.level;

    const servicesToSum = state.selectedServices.length > 0
      ? state.selectedServices
      : state.selectedService
      ? [state.selectedService]
      : [];

    if (servicesToSum.length === 0) return 0;

    let price = servicesToSum.reduce((sum, svc) => {
      return sum + (isMember || isFirstTime
        ? svc.priceMember[level]
        : svc.priceRegular[level]);
    }, 0);

    if (state.hasAddon) {
      price += 600;
    }
    return price;
  };

  return (
    <BookingContext.Provider
      value={{
        state,
        setUser: (user) => update({ user }),
        setLoggedIn: (isLoggedIn) => update({ isLoggedIn }),
        setConsentSigned: (consentSigned) => update({ consentSigned }),
        setSelectedStore: (selectedStore) => update({ selectedStore }),
        setSelectedTeacher: (selectedTeacher) => update({ selectedTeacher }),
        setSelectedService: (selectedService) => update({ selectedService }),
        setSelectedServices: (selectedServices) => update({ selectedServices }),
        setHasAddon: (hasAddon) => update({ hasAddon }),
        setSelectedDate: (selectedDate) => update({ selectedDate }),
        setSelectedTime: (selectedTime) => update({ selectedTime }),
        setNotes: (notes) => update({ notes }),
        setCurrentStep: (currentStep) => update({ currentStep }),
        resetBooking: () => {
          if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY);
          setState((prev) => ({
            ...initialState,
            user: prev.user,
            isLoggedIn: prev.isLoggedIn,
            consentSigned: prev.consentSigned,
          }));
        },
        getTotalPrice,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
