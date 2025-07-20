import logo from "../assets/logisticsLogo.svg";
import { Button } from "./ui/button";
import { IoIosGitBranch } from "react-icons/io";
import { FaRegUser } from "react-icons/fa6";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { MdOutlineLock } from "react-icons/md";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { adminLoginApi, getBranchesApi } from "@/api/admin";
import { branchLoginApi } from "@/api/branch";
import { VscLoading } from "react-icons/vsc";
import { getVersion } from "@tauri-apps/api/app";
import tikonaLogo from "../assets/tikona-logo.png";

interface BranchesType {
  id: string;
  branchName: string;
}

export default function Login() {
  const router = useNavigate();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [branches, setBranches] = useState<BranchesType[]>([]);
  const [selectedValue, setSelectedValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [version, setVersion] = useState("");

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userName || !password) {
      toast.warn("Please fill all the fields");
      return;
    }
    setIsLoading(true);
    
    if (selectedValue === "") {
      toast.warn("Please select a Branch");
      setIsLoading(false);
      return;
    } else if (selectedValue === "admin") {
      const response = await adminLoginApi(userName, password);
      if (response?.status === 200) {
        toast.success("Login Successful");
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("id", response.data.data.id);
        localStorage.setItem(
          "branchDetails",
          JSON.stringify(response.data.data),
        );
        router("/home");
      } else {
        toast.error("Invalid Credentials or Server Error");
      }
    } else {
      const response = await branchLoginApi(selectedValue, password);
      if (response?.status === 200) {
        toast.success("Login Successful");
        localStorage.setItem("isAdmin", "false");
        localStorage.setItem("id", response.data.data.id);
        localStorage.setItem(
          "branchDetails",
          JSON.stringify(response.data.data),
        );
        router("/home");
      } else {
        toast.error("Invalid Credentials or Server Error");
      }
    }
    setIsLoading(false);
  };

  async function fetchBranches() {
    const response = await getBranchesApi();
    if (response?.status === 200) {
      setBranches(response.data.data);
    }
  }

  useEffect(() => {
    fetchBranches();
    getVersion().then(setVersion);
  }, []);

  return (
    <main className="flex h-screen flex-col items-center justify-between">
      <section className="grid h-full place-content-center">
        <form
          className="flex w-[20rem] flex-col items-center gap-10"
          onSubmit={onFormSubmit}
        >
          <img src={logo} alt="logo" />
          <h3 className="text-xl font-medium">Welcome Back!</h3>
          <div className="w-full">
            <Select onValueChange={setSelectedValue} value={selectedValue}>
              <SelectTrigger className="w-full border-black">
                <p className="flex items-center gap-2 text-black">
                  <IoIosGitBranch size={24} color="black" />
                  {selectedValue ? (
                    <span className="capitalize">{selectedValue}</span>
                  ) : (
                    <span>Select Branch</span>
                  )}
                </p>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                {branches.map((branch) => (
                  <SelectItem value={branch.branchName} key={branch.id}>
                    {branch.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-col gap-5 text-sm">
            <div className="flex w-full items-center gap-2 rounded-md border border-black p-2 px-3">
              <FaRegUser size={14} />
              <input
                placeholder="Username"
                className="w-full outline-none placeholder:font-medium"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="flex w-full items-center gap-2 rounded-md border border-black p-2 px-3">
              <MdOutlineLock size={17} />
              <input
                placeholder="Password"
                className="w-full outline-none placeholder:font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
            </div>
          </div>
          <Button
            className="bg-primary w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <VscLoading size={24} className="animate-spin" />
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </section>
      <footer className="bg-primary flex h-[4rem] w-full flex-col items-end justify-center px-10 text-sm text-white">
        <div>{version && <p>v{version}</p>}</div>
        <div className="flex items-center gap-2 font-medium">
          <p>A Product of</p>
          <a href="https://www.trikonatech.com" target="_blank">
            <img src={tikonaLogo} alt="tikona" className="w-30 " />
          </a>
        </div>
      </footer>
    </main>
  );
}
