import type { Vehicle } from "../types/Vehicle";

const vehicles: Vehicle[] = [];

export const getVehicles = () => vehicles;

export const addVehicle = (vehicle: Vehicle) => {
  vehicles.push(vehicle);
};

export const deleteVehicle = (id: number) => {
  const index = vehicles.findIndex((v) => v.id === id);

  if (index >= 0) {
    vehicles.splice(index, 1);
  }
};