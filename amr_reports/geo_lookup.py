PROVINCE_COORDS = {
    "Harare": (-17.8292, 31.0522),
    "Bulawayo": (-20.1490, 28.5818),
    "Midlands": (-19.4580, 29.8170),
    "Manicaland": (-18.9730, 32.6700),
    "Mashonaland East": (-18.1853, 31.5519),
    "Mashonaland West": (-17.3660, 30.2000),
    "Mashonaland Central": (-17.3000, 31.3300),
    "Masvingo": (-20.0740, 30.8320),
    "Matabeleland North": (-18.9310, 27.8060),
    "Matabeleland South": (-20.9360, 29.0120),
}
FACILITY_COORDS = {
    "Harare Central Lab": (-17.8249, 31.0535),
    "Bulawayo Central Lab": (-20.1589, 28.5888),
    "Gweru Provincial Lab": (-19.4524, 29.8156),
    "Mbare Clinic": (-17.8616, 31.0248),
}
def resolve_point(name: str):
    if not name: return None
    if name in FACILITY_COORDS:
        lat, lng = FACILITY_COORDS[name]; return {"name": name, "lat": lat, "lng": lng}
    if name in PROVINCE_COORDS:
        lat, lng = PROVINCE_COORDS[name]; return {"name": name, "lat": lat, "lng": lng}
    return None
