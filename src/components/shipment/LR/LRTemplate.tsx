import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { ProfileInputs } from "@/components/settings/Settings";
import { numberToIndianWords } from "@/lib/utils";
import { LrInputs } from "@/types";
// Define styles
const styles = StyleSheet.create({
  page: {
    paddingVertical: 20,
    paddingHorizontal: 25,
    backgroundColor: "#ffffff",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    marginBottom: 10,
  },
  headerLeft: {
    width: "50%",
    paddingRight: 10,
    lineHeight: 0.8,
  },
  headerRight: {
    width: "50%",
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 15,
    fontWeight: "bold",
    paddingBottom: 5,
  },
  subText: {
    fontSize: 10,
  },
  sectionTitle: {
    textAlign: "center",
    fontWeight: "bold",
    marginVertical: 5,
    border: "1px solid #000000",
    padding: "3px",
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 5,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  detailsColumn: {
    width: "50%",
    paddingRight: 10,
  },
  label: {
    fontWeight: "bold",
  },
  table: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCol: {
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableHeader: {
    backgroundColor: "#eee",
    fontWeight: "bold",
  },
  remarks: {
    marginTop: 10,
    flexDirection: "column",
    gap: 5,
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 50,
  },
});

const LRTemplate = ({
  LRData,
  companyProfile,
}: {
  LRData?: LrInputs | undefined;
  companyProfile?: ProfileInputs;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyName}>Shree LN Logistics</Text>
          <Text style={styles.subText}>
            (Fleet owners & Transport Contractors)
          </Text>
          <Text style={styles.subText}>An ISO 9001 : 2015 Company</Text>
          <Text style={styles.subText}>{companyProfile?.address}</Text>
          <Text style={styles.subText}>Email: {companyProfile?.email}</Text>
          <Text style={styles.subText}>
            Ph.: Mob: {companyProfile?.contactNumber},{" "}
            {companyProfile?.alternateContactNumber}
          </Text>
        </View>
        <View style={[styles.headerRight, { gap: 5 }]}>
          <Image
            src="https://shreeln-bucket.s3.ap-south-1.amazonaws.com/logo.png"
            style={{
              width: 200,
              height: 50,
              paddingBottom: 5,
              paddingRight: 10,
            }}
          />
          <Text style={styles.subText}>
            <Text style={styles.label}>GSTIN: </Text>
            {companyProfile?.GSTIN}
          </Text>
          <Text style={styles.subText}>
            <Text style={styles.label}>MSME: </Text>
            UDYAM-KR-03-0047774
          </Text>
          <Text style={styles.subText}>
            <Text style={styles.label}>PAN: </Text>
            BDQPJ8107H
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Lorry Receipt (LR)</Text>

      <View style={styles.detailsRow}>
        <View style={[styles.detailsColumn, { gap: 5 }]}>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "11rem" }]}>
              Consignor's Name
            </Text>
            <Text>: {LRData?.consignorName}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "11rem" }]}>
              Consignor's GSTIN
            </Text>
            <Text>: {LRData?.consignorGSTIN}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "11rem" }]}>
              Consignor Address
            </Text>
            <View style={{ flexDirection: "row", gap: 3 }}>
              <Text>:</Text>
              <View>
                <Text>{LRData?.consignorAddress},</Text>
                <Text>{LRData?.consignorPincode}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "11rem" }]}>
              Consignee’s Name
            </Text>
            <Text>: {LRData?.consigneeName}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "11rem" }]}>
              Consignee’s GSTIN
            </Text>
            <Text>: {LRData?.consigneeGSTIN}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "11rem" }]}>
              Consignee’s Address
            </Text>
            <View style={{ flexDirection: "row", gap: 3 }}>
              <Text>:</Text>
              <View>
                <Text>{LRData?.consigneeAddress},</Text>
                <Text>{LRData?.consigneePincode}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{ width: "30%", gap: 3 }}>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "8rem" }]}>LR#</Text>
            <Text>: {LRData?.lrNumber}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "8rem" }]}>Date</Text>
            <Text>: {new Date(LRData?.date || "").toLocaleDateString()}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "8rem" }]}>From</Text>
            <Text>: {LRData?.from}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "8rem" }]}>To</Text>
            <Text>: {LRData?.to}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "8rem" }]}>Payment Type</Text>
            <Text>: {LRData?.paymentType}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCol, { width: "12%" }]}>
            No of Packages
          </Text>
          <Text style={[styles.tableCol, { width: "15%" }]}>
            Method of Packing
          </Text>
          <Text style={[styles.tableCol, { width: "30%" }]}>
            Description (said to contain)
          </Text>
          <Text style={[styles.tableCol, { width: "10%" }]}>Size</Text>
          <Text style={[styles.tableCol, { width: "10%" }]}>Weight</Text>
          <Text style={[{ width: "30%", padding: 5 }]}>Rate</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={[styles.tableCol, { width: "12%" }]}>
            {LRData?.noOfPackages}
          </Text>
          <Text style={[styles.tableCol, { width: "15%" }]}>
            {LRData?.methodOfPacking}
          </Text>
          <View
            style={[
              styles.tableCol,
              {
                width: "30%",
                gap: 20,
              },
            ]}
          >
            <Text style={{ width: "90%" }}>{LRData?.description}</Text>
            <View style={{ textAlign: "center" }}>
              <Text>Invoice no.: {LRData?.invoiceNo}</Text>
              <Text>
                Invoice date:{" "}
                {new Date(LRData?.invoiceDate || "").toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={[styles.tableCol, { width: "10%" }]}>
            {LRData?.sizeL && (
              <>
                <Text>L {LRData?.sizeL}</Text>
                <Text>W {LRData?.sizeW}</Text>
                <Text>H {LRData?.sizeH}</Text>
              </>
            )}
            {LRData?.ftl && <Text>FTL {LRData?.ftl}</Text>}
          </View>
          <Text style={[styles.tableCol, { width: "10%" }]}>
            {LRData?.weight}
          </Text>
          <View style={[{ width: "30%", gap: 3, padding: 5 }]}>
            {LRData?.freightCharges && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text>Freight Charges</Text>
                <Text>{LRData?.freightCharges}</Text>
              </View>
            )}
            {LRData?.hamali && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>Hamali</Text>
                <Text>{LRData?.hamali}</Text>
              </View>
            )}
            {LRData?.surcharge && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>Surcharge </Text>
                <Text>{LRData?.surcharge}</Text>
              </View>
            )}
            {LRData?.stCh && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>ST. Ch.</Text>
                <Text>{LRData?.stCh}</Text>
              </View>
            )}
            {LRData?.riskCh && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>Risk Ch.</Text>
                <Text>{LRData?.riskCh}</Text>
              </View>
            )}
            {LRData?.others && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>Others</Text>
                <Text>{LRData?.others}</Text>
              </View>
            )}
            {LRData?.unLoading && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>UnLoading</Text>
                <Text>{LRData?.unLoading}</Text>
              </View>
            )}
            {LRData?.extraKms && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>Extra KMs/Weight</Text>
                <Text>{LRData?.extraKms}</Text>
              </View>
            )}
            {LRData?.detention && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>Detention</Text>
                <Text>{LRData?.detention}</Text>
              </View>
            )}
            {LRData?.weightment && (
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text style={{ width: "8rem" }}>Weightment</Text>
                <Text>{LRData?.weightment}</Text>
              </View>
            )}
          </View>
        </View>
        <View
          style={{
            borderTop: "1px solid black",
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 5,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ width: "50%", textTransform: "capitalize" }}>
            Amount in words{" "}
            {LRData?.totalAmt && numberToIndianWords(LRData?.totalAmt)}
          </Text>
          <Text>Total INR {LRData?.totalAmt.toFixed(2)}</Text>
        </View>
      </View>

      <View style={[styles.detailsRow]}>
        <View style={[styles.detailsColumn, { gap: 5 }]}>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "8rem" }]}>Vehicle type</Text>
            <Text>: {LRData?.Vehicle?.vehicletypes}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "8rem" }]}>
              Vehicle Number
            </Text>
            <Text>: {LRData?.Vehicle?.vehicleNumber}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[styles.label, { width: "8rem" }]}>Value</Text>
            <Text>: {LRData?.value ? LRData?.value : "As per invoice"}</Text>
          </View>
        </View>
        <View style={[styles.detailsColumn, { gap: 5 }]}>
          {LRData?.ewbNumber && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Text style={[styles.label, { width: "8rem" }]}>EWB Number </Text>
              <View style={{ flexDirection: "row", gap: 3 }}>
                <Text>:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  <Text>{LRData?.ewbNumber}</Text>
                </View>
              </View>
            </View>
          )}
          {LRData?.ewbExpiryDate && (
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "8rem" }]}>
                EWB Exp Date
              </Text>
              <Text>
                : {new Date(LRData?.ewbExpiryDate || "").toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.signatureSection}>
        <Text>Signature of Consignor or the Agent</Text>
        <Text>For Shree LN Logistics</Text>
      </View>

      <View style={styles.remarks}>
        <Text style={styles.label}>Remarks</Text>
        <View style={{ flexDirection: "row", gap: 3 }}>
          <Text>1. </Text>
          <Text>
            This consignment is booked at the owner's risk; the transporter
            shall not be held responsible for any leakage, breakage, damage, or
            loss occurring during transit.
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 3 }}>
          <Text>2. </Text>
          <Text>
            The consignment will not be detained, diverted, re-routed or
            re-booked without Consignor/Consignee written instruction.
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 3 }}>
          <Text>3. </Text>
          <Text>
            LR must be acknowledged with the company’s seal, contact number, and
            authorized signature upon delivery.
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default LRTemplate;
