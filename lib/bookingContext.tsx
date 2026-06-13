"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Store, Teacher, Service, mockUser } from "./mockData";

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
  hasAddon: false,
  selectedDate: null,
  selectedTime: null,
  notes: "",
  currentStep: 0,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);

  const update = (partial: Partial<BookingState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const getTotalPrice = () => {
    if (!state.selectedService || !state.selectedTeacher) return 0;
    const isMember = state.user?.isMember || false;
    const isFirstTime = state.user?.isNewUser || false;
    const level = state.selectedTeacher.level;

    let price = isMember || isFirstTime
      ? state.selectedService.priceMember[level]
      : state.selectedService.priceRegular[level];

    if (state.hasAddon) {
      price += 600; // addon is always +600
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
        setHasAddon: (hasAddon) => update({ hasAddon }),
        setSelectedDate: (selectedDate) => update({ selectedDate }),
        setSelectedTime: (selectedTime) => update({ selectedTime }),
        setNotes: (notes) => update({ notes }),
        setCurrentStep: (currentStep) => update({ currentStep }),
        resetBooking: () =>
          setState((prev) => ({
            ...initialState,
            user: prev.user,
            isLoggedIn: prev.isLoggedIn,
            consentSigned: prev.consentSigned,
          })),
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
