import type { ExtractionResult } from './types';

export const DEMO_EXTRACTIONS: Record<string, ExtractionResult> = {
  "GUILLERMO_REYES_v_LIONEL_FRANCOIS": {
    "extraction_confidence": "high",
    "report_metadata": {
      "accident_number": "MV-2018-078-002001",
      "report_number": "23",
      "precinct": "078",
      "officer_name": "SGT DEREK C STEERL",
      "officer_badge_tax_id": "960580",
      "reviewing_officer": "",
      "date_filed": "2020-08-07"
    },
    "accident_details": {
      "date": "2018-12-06",
      "day_of_week": "THURSDAY",
      "time": "14:20",
      "location_road": "FLATBUSH AVENUE",
      "location_cross_street": "PLAZA STREET EAST",
      "location_borough": "Brooklyn/Kings County",
      "full_location": "FLATBUSH AVENUE at PLAZA STREET EAST, Brooklyn/Kings County",
      "num_vehicles": 2,
      "num_injured": 0,
      "num_killed": 0,
      "description_verbatim": "AT TPO V1 STATES WHILE DRIVING NB ON FLATBUSH IN THE RIGHT LANE OF 2 LANES STATES V2 WAS COMING OVER FROM THE BUS LANE INTO THE MIDDLE LANE AND STRUCK V1. V2 STATES WHILE DRIVING NB ON FLATBUSH IN THE RIGHT LANE , V1 WAS IN THE MIDDLE LANE AND CAME OVER AND STRUCK V2 NO INJURIES PO DID NOT WITNESS.",
      "accident_type": "2 SIDE SWIPE (SAME DIR)"
    },
    "client_party": {
      "role": "vehicle_1_driver",
      "first_name": "Guillermo",
      "last_name": "Reyes",
      "full_name": "Guillermo Reyes",
      "sex": "M",
      "date_of_birth": "1994-11-21",
      "address": "195 ILLINOIS AVE",
      "city": "PATERSON",
      "state": "NJ",
      "zip": "07503",
      "drivers_license": "R29823070006942",
      "plate_number": "XCGY85",
      "vehicle_year_make_model": "2010 FREIGHTLINER BOX TRUCK",
      "vehicle_type": "135",
      "registration_name": "B AND F TRANSPORT LTD",
      "insurance_code": "100",
      "injuries": ""
    },
    "adverse_party": {
      "role": "vehicle_2_driver",
      "first_name": "Lionel",
      "last_name": "Francois",
      "full_name": "Lionel Francois",
      "sex": "M",
      "date_of_birth": "1955-12-21",
      "address": "724 EAST 93 STREET",
      "city": "BROOKLYN",
      "state": "NY",
      "zip": "11419",
      "drivers_license": "403334776",
      "plate_number": "47164BB",
      "vehicle_year_make_model": "2011 FORD VAN",
      "vehicle_type": "100",
      "registration_name": "JEANBAPTISTE, YVON, U",
      "insurance_code": ""
    },
    "other_involved_persons": [
      {
        "name": "GRANDEZ, LUIS",
        "age": 30,
        "sex": "M",
        "role": "passenger"
      },
      {
        "name": "NDIAYE, MOMY",
        "age": 41,
        "sex": "F",
        "role": "passenger"
      }
    ],
    "uncertain_fields": [],
    "statute_of_limitations_date_8yr": "2026-12-06"
  },
  "DARSHAME_NOEL_v_FRANCIS_E_FREESE": {
    "extraction_confidence": "high",
    "report_metadata": {
      "accident_number": "MV-2019-112-000396",
      "report_number": "MV-2019-112-000396",
      "precinct": "112",
      "officer_name": "JAMES J VACCARO",
      "officer_badge_tax_id": "965583",
      "reviewing_officer": "SGT CHRISTOPHE U HASSAN",
      "date_filed": "2020-09-22"
    },
    "accident_details": {
      "date": "2019-12-15",
      "day_of_week": "FRIDAY",
      "time": "17:00",
      "location_road": "4391 B/B LONG ISLAND EXPRESSWAY",
      "location_cross_street": "WOODHAVEN BLVD",
      "location_borough": "Queens",
      "full_location": "4391 B/B Long Island Expressway at Woodhaven Blvd, Queens",
      "num_vehicles": 2,
      "num_injured": 0,
      "num_killed": 0,
      "description_verbatim": "AT TPO DRIVER OF MV1 STATES THAT SHE WAS DRIVING STRAIGHT AHEAD IN TRAFFIC WHEN DRIVER OF MV2 DID STRIKE HER VEHICLE IN THE REAR CAUSING DAMAGE TO VEHICLE. DRIVER OF MV2 STATES THAT HE WAS DRIVING STRAIGHT WHEN HE LOOKED TO HIS SIDE TO CHANGE LANES AND WHEN LOOKED FOWARD NOTICED MV1 HAD STOPPED AND MV2 HIT MV1 IN THE REAR CAUSING DAMAGE TO FRONT OF MV1 AND REAR OF MV2. MV1 TOWED BY KNIGHTS TOWING. **** AMEND DETAILS",
      "accident_type": "REAR END"
    },
    "client_party": {
      "role": "vehicle_1_driver",
      "first_name": "DARSHAME",
      "last_name": "NOEL",
      "full_name": "DARSHAME NOEL",
      "sex": "F",
      "date_of_birth": "1991-09-22",
      "address": "10434 164TH PL",
      "city": "QUEENS",
      "state": "NY",
      "zip": "11433",
      "drivers_license": "502461480",
      "plate_number": "DYY6557",
      "vehicle_year_make_model": "2018 MAZDA",
      "vehicle_type": "SW/SUV",
      "registration_name": "NOEL, DARSHAME",
      "insurance_code": "639",
      "injuries": ""
    },
    "adverse_party": {
      "role": "vehicle_2_driver",
      "first_name": "CHRISTOPHER",
      "last_name": "FREESE",
      "full_name": "CHRISTOPHER S FREESE",
      "sex": "M",
      "date_of_birth": "1941-01-22",
      "address": "1417 EAST 57 STREET",
      "city": "BROOKLYN",
      "state": "NY",
      "zip": "11234",
      "drivers_license": "102693180",
      "plate_number": "HGX7104",
      "vehicle_year_make_model": "2013 SUBARU SEDAN",
      "vehicle_type": "SEDAN",
      "registration_name": "FREESE, FRANCIS, E",
      "insurance_code": "148"
    },
    "other_involved_persons": [],
    "uncertain_fields": [],
    "statute_of_limitations_date_8yr": "2027-12-15"
  },
  "FAUSTO_CASTILLO_v_CHIMIE_DORJEE": {
    "extraction_confidence": "high",
    "report_metadata": {
      "accident_number": "MV-2022-024-000521",
      "report_number": "MV-2022-024-000521",
      "precinct": "024",
      "officer_name": "WILLIAM J CLUNE",
      "officer_badge_tax_id": "970457",
      "reviewing_officer": "WILLIAM J CLUNE",
      "date_filed": null
    },
    "accident_details": {
      "date": "2022-11-16",
      "day_of_week": "WEDNESDAY",
      "time": "20:01",
      "location_road": "WEST 105 STREET",
      "location_cross_street": "CENTRAL PARK WEST",
      "location_borough": "NEW YORK",
      "full_location": "WEST 105 STREET at CENTRAL PARK WEST, NEW YORK",
      "num_vehicles": 1,
      "num_injured": 1,
      "num_killed": 0,
      "description_verbatim": "AT TPO OPERATOR OF VEHICLE 1 STATES HE WAS DRIVING NORTHBOUND ON CENTRAL PARK WEST WHEN HE STRUCK PEDESTRIAN WHO WAS IN THE CROSSWALK. OPERATOR OF VEHICLE 1 DID NOT SEE PEDESTRIAN STANDING ON CROSSWALK. PEDESTRIAN STATES HE WAS STANDING IN THE CROSSWALK WHEN HE WAS HIT BY VEHICLE 1 CAUSING PAIN TO HEAD, JAW, AND RIGHT KNEE. PEDESTRIAN WAS TREATED AT SCENE BY EMT CRUZ, BUS NUMBER 11A. ACR 88669032",
      "accident_type": "VEHICLE vs PEDESTRIAN"
    },
    "client_party": {
      "role": "pedestrian",
      "first_name": "FAUSTO",
      "last_name": "CASTILLO",
      "full_name": "FAUSTO CASTILLO",
      "sex": "M",
      "date_of_birth": "1976-12-11",
      "address": "106 WEST 105 STREET",
      "city": "NEW YORK",
      "state": "NY",
      "zip": null,
      "drivers_license": null,
      "plate_number": null,
      "vehicle_year_make_model": null,
      "vehicle_type": null,
      "registration_name": null,
      "insurance_code": null,
      "injuries": "PAIN TO HEAD, JAW, AND RIGHT KNEE"
    },
    "adverse_party": {
      "role": "vehicle_1_driver",
      "first_name": "CHIMIE",
      "last_name": "DORJEE",
      "full_name": "CHIMIE DORJEE",
      "sex": "M",
      "date_of_birth": "1994-08-18",
      "address": "142-001 41 AVENUE 2B",
      "city": "QUEENS",
      "state": "NY",
      "zip": "11355",
      "drivers_license": "734584960",
      "plate_number": "T698783C",
      "vehicle_year_make_model": "2019 CHEVROLET SEDAN",
      "vehicle_type": "SEDAN",
      "registration_name": "NYIMA, TASHI",
      "insurance_code": "36"
    },
    "other_involved_persons": [],
    "uncertain_fields": [
      {
        "field": "client_party.zip",
        "reason": "Zip code not clearly visible for pedestrian address"
      }
    ],
    "statute_of_limitations_date_8yr": "2030-11-16"
  },
  "JOHN_GRILLO_v_KIM_CHE_H": {
    "extraction_confidence": "high",
    "report_metadata": {
      "accident_number": "MV-2020-010-000485",
      "report_number": "MV-2020-010-000485",
      "precinct": "010",
      "officer_name": "JOSE A GUZMAN",
      "officer_badge_tax_id": "952818",
      "reviewing_officer": "SGT DAVID M ALLEVA",
      "date_filed": "2020-07-17"
    },
    "accident_details": {
      "date": "2020-07-16",
      "day_of_week": "THURSDAY",
      "time": "07:30",
      "location_road": "WEST 24 STREET",
      "location_cross_street": "12 AVENUE",
      "location_borough": "New York",
      "full_location": "WEST 24 STREET at 12 AVENUE, New York",
      "num_vehicles": 1,
      "num_injured": 0,
      "num_killed": 0,
      "description_verbatim": "AT TPO M/V # 1 STATES THAT HE WAS MAKING LEFT TURN WHEN BICYCLIST MOVED INTO HIS LANE . BICYCLIST STATES THAT HE WAS TRAVELING E/B ON WEST 24 STREET WHEN MOTORIST HIT HIM .BICYCLIST STATES HE WOULD SEEK MEDICAL ATTENTION ON HIS OWN. ALL INVOLVED RNA. PATROL SUPERVISOR NOTIFIED OF COLLISION. BICYCLE SAFETY INSPECTION CONDUCTED ON BICYCLE WITH NEGATIVE RESULTS.",
      "accident_type": "Side Swipe (same dir)"
    },
    "client_party": {
      "role": "bicyclist",
      "first_name": "JOHN",
      "last_name": "GRILLO",
      "full_name": "JOHN GRILLO",
      "sex": "M",
      "date_of_birth": "1997-10-29",
      "address": "75 WEST END AVENUE",
      "city": "NEW YORK",
      "state": "NY",
      "zip": "10023",
      "drivers_license": null,
      "plate_number": null,
      "vehicle_year_make_model": null,
      "vehicle_type": "BIKE",
      "registration_name": null,
      "insurance_code": "162",
      "injuries": ""
    },
    "adverse_party": {
      "role": "vehicle_1_driver",
      "first_name": "KIM",
      "last_name": "CHE, H",
      "full_name": "KIM CHE, H",
      "sex": "M",
      "date_of_birth": "1986-04-19",
      "address": "1234 5 AVENUE",
      "city": "NEW YORK",
      "state": "NY",
      "zip": "10029",
      "drivers_license": "596922972",
      "plate_number": "AZ2874",
      "vehicle_year_make_model": "2017 ME BE SEDAN",
      "vehicle_type": "SEDAN",
      "registration_name": "HUDSON RIVER PARK",
      "insurance_code": ""
    },
    "other_involved_persons": [
      {
        "name": "JOHNSON, SHAWN",
        "age": 25,
        "sex": "M",
        "role": "witness"
      }
    ],
    "uncertain_fields": [],
    "statute_of_limitations_date_8yr": "2028-07-16"
  },
  "MARDOCHEE_VINCENT_v_RONALD_J_TRENT": {
    "extraction_confidence": "high",
    "report_metadata": {
      "accident_number": "MV-2022-071-000314",
      "report_number": "MV-2022-071-000314",
      "precinct": "071",
      "officer_name": "PEDRO MENDEZ",
      "officer_badge_tax_id": "971561",
      "reviewing_officer": "SGT HASAD BAKSH",
      "date_filed": "2022-04-04"
    },
    "accident_details": {
      "date": "2022-03-31",
      "day_of_week": "THURSDAY",
      "time": "15:06",
      "location_road": "211 CROWN STREET",
      "location_cross_street": "ROGERS AVENUE",
      "location_borough": "Brooklyn/Kings County",
      "full_location": "211 Crown Street at Rogers Avenue, Brooklyn/Kings County",
      "num_vehicles": 2,
      "num_injured": 2,
      "num_killed": 0,
      "description_verbatim": "AT T/P/O, DRIVER OF VEHICLE #1 BEARING NY LICENSE PLATE 20065SH STATES SHE WAS DOUBLE PARKED IN FRONT OF ABOVE LOCATION WITH HER RED LIGHTS FLASHING, LETTING A CHILD OFF THE SCHOOL BUS. DRIVER OF VEHICLE #1 FURTHER STATES DRIVER OF VEHICLE #2 BEARING NY LICENSE PLATE 61171MK THEN ATTEMPTED TO DRIVE AROUND THE DRIVERS SIDE OF VEHICLE #1 AND PROCEEDED TO COLLIDE WITH THE DRIVERS SIDE REAR CORNER OF VEHICLE #1. NO",
      "accident_type": "Rear End/Side Impact"
    },
    "client_party": {
      "role": "vehicle_1_driver",
      "first_name": "MARDOCHEE",
      "last_name": "VINCENT",
      "full_name": "MARDOCHEE VINCENT",
      "sex": "F",
      "date_of_birth": "1984-07-25",
      "address": "19 PICKETT CT",
      "city": "MALVERNE",
      "state": "NY",
      "zip": "11565",
      "drivers_license": "744020735",
      "plate_number": "20065SH",
      "vehicle_year_make_model": "2015 THOMAS BUILT BUS",
      "vehicle_type": "BUS",
      "registration_name": "Y&M TRANSIT CORP",
      "insurance_code": "263",
      "injuries": "Yes"
    },
    "adverse_party": {
      "role": "vehicle_2_driver",
      "first_name": "RONALD",
      "last_name": "TRENT",
      "full_name": "RONALD J TRENT",
      "sex": "M",
      "date_of_birth": "1969-12-11",
      "address": "16701 HIGHLAND AVENUE",
      "city": "QUEENS",
      "state": "NY",
      "zip": "11432",
      "drivers_license": "705349313",
      "plate_number": "61171MK",
      "vehicle_year_make_model": "2017 CHEVROLET SW/SUV",
      "vehicle_type": "SW/SUV",
      "registration_name": "FEDERAL EXPRESS CORP",
      "insurance_code": "263"
    },
    "other_involved_persons": [
      {
        "name": "CRAWFORD, DARNELL, W",
        "age": 28,
        "sex": "M",
        "role": "passenger"
      },
      {
        "name": "MAYA IGLESIAS, CHRISTOPHER",
        "age": 13,
        "sex": "M",
        "role": "passenger"
      },
      {
        "name": "GORDON, JAYCEE",
        "age": 5,
        "sex": "M",
        "role": "passenger"
      },
      {
        "name": "TULLOCH, JAMEL",
        "age": 8,
        "sex": "M",
        "role": "passenger"
      },
      {
        "name": "FOSTER, JAYCEON",
        "age": 8,
        "sex": "M",
        "role": "passenger"
      }
    ],
    "uncertain_fields": [],
    "statute_of_limitations_date_8yr": "2030-03-31"
  }
};

export const DEMO_REPORTS = [
  {
    id: "GUILLERMO_REYES_v_LIONEL_FRANCOIS",
    label: "Reyes v. Francois",
    subtitle: "Vehicle-Vehicle Sideswipe",
    client: "Guillermo Reyes (M)",
    type: "Sideswipe",
    injured: 0,
    badge: "Demo Default",
  },
  {
    id: "DARSHAME_NOEL_v_FRANCIS_E_FREESE",
    label: "Noel v. Freese",
    subtitle: "Rear-End Collision",
    client: "Darshame Noel (F)",
    type: "Rear-End",
    injured: 0,
    badge: "Female Client",
  },
  {
    id: "FAUSTO_CASTILLO_v_CHIMIE_DORJEE",
    label: "Castillo v. Dorjee",
    subtitle: "Vehicle-Pedestrian (Injuries)",
    client: "Fausto Castillo (M)",
    type: "Pedestrian",
    injured: 1,
    badge: "Pedestrian + Injured",
  },
  {
    id: "JOHN_GRILLO_v_KIM_CHE_H",
    label: "Grillo v. Kim",
    subtitle: "Vehicle-Bicyclist",
    client: "John Grillo (M)",
    type: "Bicyclist",
    injured: 0,
    badge: "Bicyclist",
  },
  {
    id: "MARDOCHEE_VINCENT_v_RONALD_J_TRENT",
    label: "Vincent v. Trent",
    subtitle: "Bus Sideswipe (2 Injured)",
    client: "Mardochee Vincent (F)",
    type: "Sideswipe/Rear-End",
    injured: 2,
    badge: "Bus + Multiple Injuries",
  },
] as const;
