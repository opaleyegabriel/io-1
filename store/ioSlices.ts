import { IOState } from "@/type";
import { createSlice } from "@reduxjs/toolkit";

const initialState ={
    origin: null,
    destination: null,
    travelTimeInformation:null,
};
export const ioSlices =  createSlice({
    name: "io",
    initialState,
    reducers:{
        setOrigin:(state, action) => {
            state.origin = action.payload;
        },
        setDestination:(state, action) => {
            state.destination = action.payload;
        },
        setTravelTimeInformation: (state, action) => {
            state.travelTimeInformation = action.payload;
        },
    },
});

export const {setOrigin, setDestination, setTravelTimeInformation}  = ioSlices.actions;

//selectors
export const selectOrigin = (state: IOState) => state.io.origin;
export const selectDestination = (state: IOState) => state.io.destination;
export const selectTravelTimeInformation = (state: IOState) => state.io.travelTimeInformation;
export default ioSlices.reducer;
