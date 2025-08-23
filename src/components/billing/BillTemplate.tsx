import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { BankDetailsInputs, ProfileInputs } from "../settings/Settings";
import { billInputs } from "@/types";
// Define styles
const styles = StyleSheet.create({
  page: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    fontSize: 10,
    justifyContent: "space-between",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "space-between",
    gap: 70,
  },
  headerLeft: {
    width: "65%",
    paddingRight: 10,
    lineHeight: 0.8,
  },
  headerRight: {
    width: "50%",
    alignItems: "flex-start",
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
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  detailsColumn: {
    width: "50%",
  },
  label: {
    fontWeight: "bold",
  },
  table: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCol: {
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 4,
    fontSize: 8,
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
    marginVertical: 30,
    alignItems: "flex-end",
  },
});

const BillTemplate = ({
  billInputs,
  companyProfile,
  bankDetails,
}: {
  billInputs: billInputs | undefined;
  companyProfile?: ProfileInputs;
  bankDetails?: BankDetailsInputs;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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
            <Text style={[styles.subText, { fontWeight: 600 }]}>
              Shree LN Logistics
            </Text>
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
            <Text style={styles.subText}>Billing branch:</Text>
            <Text style={styles.subText}>
              {billInputs?.Admin
                ? billInputs?.Admin?.address
                : billInputs?.Branches?.address}
            </Text>
            <Text style={[styles.subText, { fontSize: 9 }]}>
              Email:{" "}
              {billInputs?.Admin
                ? billInputs?.Admin?.email
                : billInputs?.Branches?.email}
            </Text>
            <Text style={[styles.subText, { fontSize: 9 }]}>
              Ph.: Mob:{" "}
              {billInputs?.Admin
                ? billInputs?.Admin?.contactNumber
                : billInputs?.Branches?.contactNumber}
            </Text>
          </View>
        </View>

        <View style={styles.sectionTitle}>
          <Text></Text>
          <Text>Billing Summary</Text>
          <Text>ORIGINAL</Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={[styles.detailsColumn, { gap: 5 }]}>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "11rem" }]}>Client</Text>
              <Text>: {billInputs?.Client?.name}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "11rem" }]}>
                Client GSTIN
              </Text>
              <Text>: {billInputs?.Client?.GSTIN}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "11rem" }]}>
                Client Address
              </Text>
              <View style={{ flexDirection: "row", gap: 3 }}>
                <Text>:</Text>
                <View style={{ width: "50%" }}>
                  <Text>{billInputs?.Client?.address}</Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "11rem" }]}>State</Text>
              <Text>: {billInputs?.state}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "11rem" }]}>State Code</Text>
              <View style={{ flexDirection: "row", gap: 3 }}>
                <Text>:</Text>
                <View>
                  <Text>{billInputs?.statecode}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={{ width: "30%", gap: 3 }}>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "8rem" }]}>Bill No</Text>
              <Text>: {billInputs?.billNumber}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "8rem" }]}>Bill Date</Text>
              <Text>
                : {new Date(billInputs?.date || "").toLocaleDateString()}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "8rem" }]}>Due Date</Text>
              <Text>
                : {new Date(billInputs?.dueDate || "").toLocaleDateString()}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "8rem" }]}>
                Place of Supply
              </Text>
              <Text>: {billInputs?.placeOfSupply}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "8rem" }]}>
                Service Type
              </Text>
              <Text>: By Road</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.label, { width: "8rem" }]}>
                HSN / SAC Code
              </Text>
              <Text>: {billInputs?.hsnSacCode}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol, { width: "6%" }]}>Sl no.</Text>
            <Text style={[styles.tableCol, { width: "8%" }]}>LR#</Text>
            <Text style={[styles.tableCol, { width: "13%" }]}>LR Date</Text>
            <Text style={[styles.tableCol, { width: "15%" }]}>Origin</Text>
            <Text style={[styles.tableCol, { width: "15%" }]}>Dest.</Text>
            <Text style={[styles.tableCol, { width: "17%" }]}>Desc.</Text>
            <Text style={[styles.tableCol, { width: "10%" }]}>Inv. no.</Text>
            <Text style={[styles.tableCol, { width: "13%" }]}>Inv. Date</Text>
            <Text style={[styles.tableCol, { width: "11%" }]}>
              Vehicle Type
            </Text>
            <Text style={[styles.tableCol, { width: "13%" }]}>Vehicle No.</Text>
            <Text style={[styles.tableCol, { width: "9%" }]}>Weight</Text>
            <Text style={[{ width: "10%", padding: 5, fontSize: 8 }]}>
              Freight Amount
            </Text>
          </View>

          {billInputs?.lrData?.map((lrData, index) => (
            <View style={styles.tableRow} key={lrData.lrNumber}>
              <Text style={[styles.tableCol, { width: "6%" }]}>
                {index + 1}
              </Text>
              <Text style={[styles.tableCol, { width: "8%" }]}>
                {lrData.lrNumber}
              </Text>
              <Text style={[styles.tableCol, { width: "13%" }]}>
                {new Date(lrData.date).toLocaleDateString()}
              </Text>
              <Text style={[styles.tableCol, { width: "15%" }]}>
                {lrData.from}
              </Text>
              <Text style={[styles.tableCol, { width: "15%" }]}>
                {lrData.to}
              </Text>
              <Text style={[styles.tableCol, { width: "17%", fontSize: 6 }]}>
                {lrData.description}
              </Text>
              <Text style={[styles.tableCol, { width: "10%" }]}>
                {lrData.invoiceNo}
              </Text>
              <Text style={[styles.tableCol, { width: "13%" }]}>
                {lrData.invoiceDate
                  ? new Date(lrData.invoiceDate).toLocaleDateString()
                  : ""}
              </Text>
              <Text style={[styles.tableCol, { width: "11%", fontSize: 7 }]}>
                {lrData.Vehicle?.vehicletypes}
              </Text>
              {lrData.Vehicle.vehicleNumber && (
                <Text style={[styles.tableCol, { width: "13%", fontSize: 7 }]}>
                  {lrData.Vehicle.vehicleNumber}
                </Text>
              )}
              <Text style={[styles.tableCol, { width: "9%", fontSize: 7 }]}>
                {lrData.weight}
              </Text>
              <Text style={[{ width: "10%", padding: 5, fontSize: 7 }]}>
                {lrData.totalAmt.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.detailsRow,
            {
              borderBottom: "1px solid black",
              borderRight: "1px solid black",
              borderLeft: "1px solid black",
              fontSize: 8,
            },
          ]}
        >
          <View style={[styles.detailsColumn, { gap: 5, paddingLeft: 5 }]}>
            <View style={{ flexDirection: "row", gap: 5 }}>
              <Text>Add: IGST Rate</Text>
              <Text>5.00%</Text>
              <Text>{billInputs?.igstRate.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 5 }}>
              <Text>Add: CGST Rate</Text>
              <Text>2.50%</Text>
              <Text>{billInputs?.cgstRate.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 5 }}>
              <Text>Add: SGST Rate</Text>
              <Text>2.50%</Text>
              <Text>{billInputs?.sgstRate.toFixed(2)}</Text>
            </View>
          </View>
          <View style={{ gap: 5, paddingRight: 5 }}>
            {billInputs?.unloading && (
              <View
                style={{
                  gap: 30,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <Text>Unloading</Text>
                  <Text>({billInputs?.unloading?.lrnumber})</Text>
                </View>
                <Text>{billInputs?.unloading.amount.toFixed(2)}</Text>
              </View>
            )}
            {billInputs?.hamali && (
              <View
                style={{
                  gap: 30,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <Text>Hamali</Text>
                  <Text>({billInputs?.hamali?.lrnumber})</Text>
                </View>
                <Text>{billInputs?.hamali?.amount.toFixed(2)}</Text>
              </View>
            )}
            {billInputs?.extraKmWeight && (
              <View
                style={{
                  gap: 30,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <Text>Extra KMs/Weight</Text>
                  <Text>({billInputs?.extraKmWeight?.lrnumber})</Text>
                </View>
                <Text>{billInputs?.extraKmWeight?.amount.toFixed(2)}</Text>
              </View>
            )}
            {billInputs?.detention && (
              <View
                style={{
                  gap: 30,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <Text>Detention</Text>
                  <Text>({billInputs?.detention?.lrnumber})</Text>
                </View>
                <Text>{billInputs?.detention?.amount.toFixed(2)}</Text>
              </View>
            )}
            {billInputs?.weightment && (
              <View
                style={{
                  gap: 30,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <Text>Weightment</Text>
                  <Text>({billInputs?.weightment?.lrnumber})</Text>
                </View>
                <Text>{billInputs?.weightment?.amount.toFixed(2)}</Text>
              </View>
            )}
            {billInputs?.others && (
              <View
                style={{
                  gap: 30,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <Text>Others</Text>
                  <Text>({billInputs?.others?.lrnumber})</Text>
                </View>
                <Text>{billInputs?.others?.amount?.toFixed(2)}</Text>
              </View>
            )}
            {billInputs?.otherCharges && (
              <View
                style={{
                  gap: 30,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", gap: 2 }}>
                  <Text>{billInputs?.otherCharges?.name}</Text>
                  <Text>({billInputs?.otherCharges?.lrnumber})</Text>
                </View>
                <Text>{billInputs?.otherCharges?.amount?.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            styles.detailsRow,
            {
              borderBottom: "1px solid black",
              borderRight: "1px solid black",
              borderLeft: "1px solid black",
              textTransform: "capitalize",
              paddingHorizontal: 5,
            },
          ]}
        >
          <Text style={{ width: "70%" }}>
            Amount in words {billInputs?.totalInWords}
          </Text>
          <Text>Total INR {billInputs?.subTotal.toFixed(2)}</Text>
        </View>
        <View style={{ marginTop: 10, gap: 3, fontSize: 8 }}>
          <Text>GST Payable on reverse charge basis Yes/No : Yes</Text>
          <Text>GST Amount payable under RCM by the billed party</Text>
          <View style={{ flexDirection: "row", gap: 3 }}>
            <Text style={{ fontWeight: 600 }}>Name</Text>
            <Text>:</Text>
            <Text>SHREE LN LOGISTICS</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 3 }}>
            <Text style={{ fontWeight: 600 }}>Bank Name</Text>
            <Text>:</Text>
            <Text>{bankDetails?.name}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 3 }}>
            <Text style={{ fontWeight: 600 }}>Account No.</Text>
            <Text>:</Text>
            <Text>{bankDetails?.accountNumber}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 3 }}>
            <Text style={{ fontWeight: 600 }}>IFSC</Text>
            <Text>:</Text>
            <Text>{bankDetails?.ifscCode}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 3 }}>
            <Text style={{ fontWeight: 600 }}>Note:</Text>
            <Text>
              Please do not make any cash payments to the lorry driver. Payments
              are to be made only via RTGS, NEFT, or IMPS in the name of SLNL.
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.remarks}>
        <View style={styles.signatureSection}>
          <View style={{ alignItems: "center", gap: 10 }}>
            <Text>For Shree LN Logistics</Text>
            <Text>Authorized Signature</Text>
          </View>
        </View>
        <View>
          <Text style={styles.label}>Declaration</Text>
          <View>
            <Text style={{ fontSize: 8, lineHeight: 1.3 }}>
              GTA is not liable to pay GST and liability to pay GST is of the
              recipient of service under Reserve Charge as per Serial No 1 of
              Notification No 13/2017 dated 20.06.2017 issued under Sub Section
              (3) of Section 9 of CGST Act, 2017 and in case of Inter state
              supply of Service, liability to pay GST is of Recipient of Service
              under Reverse Charge as per Serial No 2 of Notification No 10/2017
              dated 20.06.2017 issued under Sub Section (3) of Section 5
              of IGST Act, 2017
            </Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default BillTemplate;
