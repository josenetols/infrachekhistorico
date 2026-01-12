
export type CableCondition = 'Organizado' | 'Parcial' | 'Desorganizado';

export interface SwitchDevice {
  id: string;
  quantity: number;
  brand: string;
  model: string;
  ports: number;
  conditionOk: boolean;
  notes: string;
}

export interface AntennaDevice {
  id: string;
  quantity: number;
  brand: string; // Aruba, UniFi, Outra
  isWorking: boolean;
  notes: string;
}

export interface ProblematicMachine {
  id: string;
  identifier: string; // Asset tag or name
  processorGen: string;
  osUpdated: boolean; // Must be Windows 11 check
  problemDescription: string;
}

export interface ChecklistData {
  // 1. Local Info
  locationName: string;
  responsibleName: string; // Client contact
  visitDate: string; // ISO String

  // 2. CPD / Infrastructure
  cableCondition: CableCondition;
  cableNotes: string;
  
  switches: SwitchDevice[];
  
  antennas: AntennaDevice[];

  hasFirewall: boolean;
  firewallBrand: string; // Stores final string (e.g. "Fortinet", "SonicWall", or custom)
  firewallWorking: boolean;
  firewallNotes: string;

  // 3. Machines
  allMachinesOk: boolean;
  problematicMachines: ProblematicMachine[];

  // 4. Network Points
  networkPointsOk: boolean;
  networkPointsNotes: string;

  // 5. Satisfaction
  employeesSatisfied: boolean;
  complaints: string;

  // Meta
  observations: string;
  technicianName: string; // Responsible for the visit
}

export const initialChecklistState: ChecklistData = {
  locationName: '',
  responsibleName: '',
  visitDate: new Date().toISOString(),
  
  cableCondition: 'Organizado',
  cableNotes: '',
  
  switches: [],
  
  antennas: [],
  
  hasFirewall: false,
  firewallBrand: 'Fortinet',
  firewallWorking: true,
  firewallNotes: '',
  
  allMachinesOk: true,
  problematicMachines: [],
  
  networkPointsOk: true,
  networkPointsNotes: '',
  
  employeesSatisfied: true,
  complaints: '',
  
  observations: '',
  technicianName: '',
};
