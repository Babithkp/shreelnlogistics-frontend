import logo from "../../assets/logisticsLogo.svg";
import { Button } from "../ui/button";
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
import tikonaLogo from "../../assets/tikona-logo.png";
import Onboarding from "./Onboarding";

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
  const [fieldErrors, setFieldErrors] = useState<{
    branch?: string;
    userName?: string;
    password?: string;
  }>({});

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: typeof fieldErrors = {};
    if (!selectedValue) nextErrors.branch = "Please select a branch";
    if (!userName) nextErrors.userName = "Username is required";
    if (!password) nextErrors.password = "Password is required";
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.warn("Please fill all the fields");
      return;
    }

    setIsLoading(true);

    if (selectedValue === "admin") {
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
    <main className="flex h-screen flex-col items-center justify-between bg-[#D7EDFF]">
      <section className="flex h-full w-full gap-5 p-5">
        <div className="h-full w-1/2">
          <Onboarding />
        </div>
        <div className="flex h-full w-1/2 flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-1 items-center justify-center">
            <form
              className="flex w-[22rem] flex-col items-center gap-8"
              onSubmit={onFormSubmit}
              noValidate
            >
              <img src={logo} alt="Shreeln Logistics" className="h-12" />
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-xl font-semibold text-slate-900">
                  Welcome back
                </h1>
                <p className="text-sm text-slate-500">
                  Sign in to continue to your dashboard
                </p>
              </div>

              <div className="flex w-full flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="branch"
                    className="text-sm font-medium text-slate-700"
                  >
                    Branch
                  </label>
                  <Select
                    onValueChange={(value) => {
                      setSelectedValue(value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        branch: undefined,
                      }));
                    }}
                    value={selectedValue}
                  >
                    <SelectTrigger
                      id="branch"
                      aria-invalid={!!fieldErrors.branch}
                      className="w-full border-slate-200 text-slate-900 focus-visible:border-primary"
                    >
                      <p className="flex items-center gap-2">
                        <IoIosGitBranch size={18} className="text-slate-400" />
                        {selectedValue ? (
                          <span className="capitalize">{selectedValue}</span>
                        ) : (
                          <span className="text-slate-400">
                            Select branch
                          </span>
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
                  {fieldErrors.branch && (
                    <p className="text-xs text-red-500">
                      {fieldErrors.branch}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-slate-700"
                  >
                    Username
                  </label>
                  <div
                    className={`flex w-full items-center gap-2 rounded-md border bg-white p-2 px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
                      fieldErrors.userName
                        ? "border-red-300"
                        : "border-slate-200"
                    }`}
                  >
                    <FaRegUser size={14} className="text-slate-400" />
                    <input
                      id="username"
                      placeholder="Enter your username"
                      aria-invalid={!!fieldErrors.userName}
                      className="w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          userName: undefined,
                        }));
                      }}
                    />
                  </div>
                  {fieldErrors.userName && (
                    <p className="text-xs text-red-500">
                      {fieldErrors.userName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <div
                    className={`flex w-full items-center gap-2 rounded-md border bg-white p-2 px-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
                      fieldErrors.password
                        ? "border-red-300"
                        : "border-slate-200"
                    }`}
                  >
                    <MdOutlineLock size={17} className="text-slate-400" />
                    <input
                      id="password"
                      placeholder="Enter your password"
                      aria-invalid={!!fieldErrors.password}
                      className="w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }));
                      }}
                      type="password"
                    />
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </div>

              <Button
                className="bg-primary hover:bg-primary/90 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <VscLoading size={20} className="animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </div>
          <div className="flex h-16 w-full flex-col items-end justify-center px-10 text-sm text-slate-400">
            <div>{version && <p>v{version}</p>}</div>
            <div className="flex items-center gap-2 font-medium">
              <p className="text-slate-400">A Product of</p>
              <a href="https://www.trikonatech.com" target="_blank">
                <img src={tikonaLogo} alt="tikona" className="w-30" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
