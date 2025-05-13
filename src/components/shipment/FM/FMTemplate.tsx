import { Page, Text, View, Document, Image } from "@react-pdf/renderer";
import { FMInputs } from "./FMCreate";

export const FMTemplate = ({FmData}:{FmData?:FMInputs}) => (
  <Document>
    <Page size="A4" style={{ fontSize: "12px", padding: 20 }}>
      <View
        style={{ border: "2px solid black", height: "100%", width: "100%" }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderBottom: "1px solid black",
          }}
        >
          <Image
            src="https://i.ibb.co/5gkLZsD0/logo.png"
            style={{
              width: 200,
              height: 50,
              paddingBottom: 5,
              paddingRight: 10,
            }}
          />
          <View style={{ width: "40%", fontSize: 10 }}>
            <Text style={{ fontWeight: 500, fontSize: 16 }}>
              Shree LN Logistics
            </Text>
            <Text style={{ fontWeight: 500 }}>
              (Fleet owners & Transport Contractors)
            </Text>
            <Text style={{ fontWeight: 500 }}>An ISO 9001 : 2015 Company</Text>
            <Text style={{ fontWeight: 500 }}>
              Flat No.203, 3rd Floor, Sai Godavari Apartment, Kuduregere Road,
            </Text>
            <Text style={{ fontWeight: 500 }}>
              Madanayakanahalli, Bangalore Rural - 562162
            </Text>
            <Text style={{ fontWeight: 500 }}>
              Email: bangalore@shreelnlogistics.com
            </Text>
            <Text style={{ fontWeight: 500 }}>
              Ph.: Mob: 9036416520, 90364416521
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "black",
              width: "20%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20, color: "white", textAlign: "center" }}>
              HIRE MEMO
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderBottom: "1px solid black",
            fontWeight: 400,
          }}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>
              Memo No.
            </Text>
            <Text style={{ textAlign: "center" }}>{FmData?.fmNumber}</Text>
          </View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>Date</Text>
            <Text style={{ textAlign: "center" }}>{FmData?.date}</Text>
          </View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>
              Type of Vehicle
            </Text>
            <Text style={{ textAlign: "center" }}>{FmData?.vehicleType}</Text>
          </View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>Size</Text>
            <Text style={{ textAlign: "center" }}>{FmData?.sixtyToNinety}</Text>
          </View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>From</Text>
            <Text style={{ textAlign: "center" }}>{FmData?.from}</Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderBottom: "1px solid black",
            fontWeight: 400,
          }}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>
              Vehicle No.
            </Text>
            <Text style={{ textAlign: "center" }}>{FmData?.vehicleNo}</Text>
          </View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>Weight</Text>
            <Text style={{ textAlign: "center" }}>{            <Text style={{ textAlign: "center" }}>[FmData.e]</Text>
          }</Text>
           
          </View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>
              Payable at
            </Text>
            <Text style={{ textAlign: "center" }}>Bangalore</Text>
          </View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>
              Package
            </Text>
            <Text style={{ textAlign: "center" }}>10</Text>
          </View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
              borderLeft: "1px solid black",
              width: "100%",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: 500 }}>To</Text>
            <Text style={{ textAlign: "center" }}>Peenya</Text>
          </View>
        </View>
        <View
          style={{
            borderBottom: "1px solid black",
            padding: 10,
            paddingHorizontal: 40,
            gap: 5,
            minHeight: 150,
          }}
        >
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text>Consigmnment No.</Text>
            <Text>Date</Text>
          </View>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text>1. 5985</Text>
            <Text>10-12-2015</Text>
          </View>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text>2. 5985</Text>
            <Text>10-12-2015</Text>
          </View>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text>3. 5985</Text>
            <Text>10-12-2015</Text>
          </View>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text>3. 5985</Text>
            <Text>10-12-2015</Text>
          </View>
        </View>
        <View style={{ fontSize: 12, flexDirection: "row" }}>
          <View
            style={{
              width: "60%",
              borderRight: "1px solid black",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 20,
                padding: 5,
              }}
            >
              <Text>Broker Name: </Text>
              <Text> Shree LN Logistics</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                borderBottom: "1px solid black",
                paddingHorizontal: 20,
                padding: 5,
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row" }}>
                <Text>Telephone No. </Text>
                <Text>994549935 </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text>Contact No. </Text>
                <Text>994549935 </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                borderBottom: "1px solid black",
                paddingHorizontal: 20,
                padding: 5,
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row" }}>
                <Text>Driver Name </Text>
                <Text>BAbith</Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text>Contact No. </Text>
                <Text>994549935 </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                borderBottom: "1px solid black",
                paddingHorizontal: 20,
                padding: 5,
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row" }}>
                <Text>Owner Name </Text>
                <Text>sudarshan</Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text>Contact No. </Text>
                <Text>994549935 </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 20,
                padding: 5,
                height: 100,
              }}
            >
              <Text>Remarks</Text>
            </View>
          </View>
          <View style={{ width: "40%" }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
              }}
            >
              <Text
                style={{
                  borderRight: "1px solid black",
                  width: "100%",
                  paddingLeft: 20,
                  padding: 5,
                }}
              >
                Hire
              </Text>
              <Text
                style={{
                  width: "100%",
                  textAlign: "right",
                  paddingRight: 20,
                  padding: 5,
                }}
              >
                10,500.12
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
              }}
            >
              <Text
                style={{
                  borderRight: "1px solid black",
                  width: "100%",
                  paddingLeft: 20,
                  padding: 5,
                }}
              >
                Advance
              </Text>
              <Text
                style={{
                  width: "100%",
                  textAlign: "right",
                  paddingRight: 20,
                  padding: 5,
                }}
              >
                10,500.12
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
              }}
            >
              <Text
                style={{
                  borderRight: "1px solid black",
                  width: "100%",
                  paddingLeft: 20,
                  padding: 5,
                }}
              >
                Balance
              </Text>
              <Text
                style={{
                  width: "100%",
                  textAlign: "right",
                  paddingRight: 20,
                  padding: 5,
                }}
              >
                10,500.12
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
              }}
            >
              <Text
                style={{
                  borderRight: "1px solid black",
                  width: "100%",
                  paddingLeft: 20,
                  padding: 5,
                }}
              >
                Other Charges
              </Text>
              <Text
                style={{
                  width: "100%",
                  textAlign: "right",
                  paddingRight: 20,
                  padding: 5,
                }}
              >
                10,500.12
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
              }}
            >
              <Text
                style={{
                  borderRight: "1px solid black",
                  width: "100%",
                  paddingLeft: 20,
                  padding: 5,
                }}
              >
                Detention Charges
              </Text>
              <Text
                style={{
                  width: "100%",
                  textAlign: "right",
                  paddingRight: 20,
                  padding: 5,
                }}
              >
                10,500.12
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
              }}
            >
              <Text
                style={{
                  borderRight: "1px solid black",
                  width: "100%",
                  paddingLeft: 20,
                  padding: 5,
                }}
              >
                RTO/L/U Charges
              </Text>
              <Text
                style={{
                  width: "100%",
                  textAlign: "right",
                  paddingRight: 20,
                  padding: 5,
                }}
              >
                10,500.12
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
              }}
            >
              <Text
                style={{
                  borderRight: "1px solid black",
                  width: "100%",
                  paddingLeft: 20,
                  padding: 5,
                }}
              >
                Net Balance
              </Text>
              <Text
                style={{
                  width: "100%",
                  textAlign: "right",
                  paddingRight: 20,
                  padding: 5,
                }}
              >
                10,500.12
              </Text>
            </View>
            <View style={{ gap: 5 }}>
              <Text style={{ paddingLeft: 20, padding: 5 }}>
                Amount in words
              </Text>
              <Text style={{ paddingRight: 20, padding: 5 }}>
                One Thousand Rupees only
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            borderTop: "1px solid black",
            fontSize: 11,
            flexDirection: "row",
          }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              border: "1px solid black",
              width: "100%",
              borderRadius: 10,
              padding: 10,
              gap: 5,
            }}
          >
            <Text>
              Declare that all documents relative to the above lorry and genuine
              and valid. I hold my self liable for any loss or damage to the
              goods entrusted to the for delivery and shall be bound to
              compenalte office of the challan.
            </Text>
            <View>
              <Text>Driver's Name ...........................</Text>
              <Text>D.L. No ...........................</Text>
              <Text>Driver Signature ...........................</Text>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 20,
              border: "1px solid black",
              width: "100%",
              borderRadius: 10,
              padding: 10,
              gap: 5,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text>
              I should Guarantee for the above lorry Supplied by me and also for
              the goods entrusted to the said lorry for safe arrival at the
              destination
            </Text>
            <Text style={{ width: "50%", textAlign: "center" }}>
              Signature of Lorry Guarantor
            </Text>
          </View>
          <View
            style={{
              border: "1px solid black",
              width: "100%",
              borderRadius: 10,
              paddingVertical: 10,
              gap: 5,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                borderBottom: "1px solid black",
                paddingHorizontal: 10,
                width: "100%",
                textAlign: "center",
                padding: 5,
              }}
            >
              <Text>Issue Branch</Text>
              <Text>Bangalore</Text>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                width: "100%",
                textAlign: "center",
                justifyContent:"center",
                alignItems:"center",
                padding: 5,
                gap: 10,
              }}
            >
              <Text>For SHREE LN LOGISTICS</Text>
              <Text>Dispatch Officer</Text>
            </View>
          </View>
        </View>
        <View style={{ borderTop: "1px solid black",fontSize:10,paddingHorizontal:5,gap:10 ,paddingVertical:10}}>
          <Text>
            No Delivery on Sunday. 1. Deduction @ 1000 per Ton will be made if
            the goods are transhipped on enrouted. 2. Delay Delivery will be
            deducted if goods not delivered above mentioned days. 3. Balance
            Payment will made on payment original copy only.
          </Text>
          <Text style={{fontWeight:600,textAlign:"center"}}>DRIVER COPY</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default FMTemplate;
