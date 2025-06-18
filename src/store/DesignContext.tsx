import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DesignContextType {
  designData: any[];
  addDesignData: (data: any) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [designData, setDesignData] = useState<any[]>([]);

  const addDesignData = (data: any) => {
    setDesignData((prevData) => [...prevData, data]);
  };

  return (
    <DesignContext.Provider value={{ designData, addDesignData }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
} 