import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CreditCard,
  Globe,
  KeyRound,
  Mail,
  MapPinned,
  Palette,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react"
import { useState, type ElementType } from "react"
import { toast } from "@heroui/react"
import { NavLink } from "react-router-dom"
import type { Transition, Variants } from "motion/react"

import { ChatSidebar, folderTree } from "@/components/chat/full-chat-app"
import type { FileItem, FolderItem } from "@/components/chat/full-chat-app"
import { type AppLang, LANG_LABELS, useLang } from "@/lib/language"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/core/dialog"
import { WorkspaceSidebarShell } from "@/components/layout/workspace-sidebar-shell"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const USER = {
  firstName: "Alexandra",
  lastName: "Morgan",
  dob: "1989-04-16",
  email: "a.morgan@lawfirm.io",
  phone: "+44 20 7946 0958",
  password: "********",
  region: "London, United Kingdom",
}

const SETTINGS_NAV = [
  { id: "profile", labelKey: "nav.profile", icon: User },
  { id: "language", labelKey: "nav.language", icon: Globe },
  { id: "appearance", labelKey: "nav.appearance", icon: Palette },
  { id: "notifications", labelKey: "nav.notifications", icon: Bell },
  { id: "security", labelKey: "nav.security", icon: Shield },
  { id: "billing", labelKey: "nav.billing", icon: CreditCard },
]

function ProfileSection() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    firstName: USER.firstName,
    lastName: USER.lastName,
    dob: USER.dob,
    email: USER.email,
    phone: USER.phone,
    password: USER.password,
    region: USER.region,
  })

  const fields: {
    key: keyof typeof form
    label: string
    icon: ElementType
    type?: string
  }[] = [
    { key: "firstName", label: "First Name", icon: User },
    { key: "lastName", label: "Last Name", icon: User },
    { key: "dob", label: "Date of Birth", icon: Calendar, type: "date" },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel" },
    { key: "email", label: "Email", icon: Mail, type: "email" },
    { key: "password", label: "Password", icon: KeyRound, type: "password" },
    { key: "region", label: "Region", icon: MapPinned },
  ]

  return (
    <section className="max-w-[36rem] space-y-4">
      {fields.map(({ key, label, icon: Icon, type }) => (
        <div key={key} className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#4b5563]">
            <Icon className="size-3.5" />
            {label}
          </label>
          <input
            type={type ?? "text"}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="h-11 w-full rounded-xl border border-[#d6dce5] bg-white px-3 text-sm text-[#111827] outline-none transition-shadow focus:ring-2 focus:ring-[#94a3b8]/40"
          />
        </div>
      ))}

      <Button
        size="sm"
        className="mt-2 min-w-28 gap-2 self-start bg-[#111827] text-white hover:bg-[#0f172a]"
        onClick={() => {
          setSaved(true)
          toast("Settings saved")
          setTimeout(() => setSaved(false), 2500)
        }}
      >
        {saved ? (
          <>
            <Check className="size-3.5" />
            Saved
          </>
        ) : (
          <>
            <Save className="size-3.5" />
            Save
          </>
        )}
      </Button>
    </section>
  )
}

function LanguageSection() {
  const { lang, setLang, t } = useLang()

  return (
    <section className="max-w-[36rem] space-y-6">
      <div>
        <p className="text-sm text-[#4b5563]">{t("lang.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(Object.entries(LANG_LABELS) as [AppLang, string][]).map(([code, label]) => {
          const active = lang === code
          return (
            <button
              key={code}
              onClick={() => { setLang(code); toast(label) }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all",
                active
                  ? "border-[#291c08] bg-[#faf7f4] shadow-sm"
                  : "border-[#e2d9ce] bg-white hover:border-[#c4b49a] hover:bg-[#faf7f4]"
              )}
            >
              <span className="text-2xl">
                {code === "fr" ? "🇫🇷" : code === "ar" ? "🇩🇿" : "🇬🇧"}
              </span>
              <span className={cn("text-sm font-medium", active ? "text-[#291c08]" : "text-[#4b5563]")}>
                {label}
              </span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-[#291c08]" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function PlaceholderSection({ label }: { label: string }) {
  return (
    <section className="max-w-[36rem]">
      <p className="text-sm text-[#4b5563]">{label} settings coming soon.</p>
    </section>
  )
}

export function SettingsPage() {
  const { t } = useLang()
  const [section, setSection] = useState("profile")
  const [folders, setFolders] = useState<FolderItem[]>(folderTree)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set([folderTree[0]?.id ?? ""])
  )
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
  const [creationMode, setCreationMode] = useState<"folder" | "file" | null>(null)
  const [creationValue, setCreationValue] = useState("")
  const [creationFolderId, setCreationFolderId] = useState<string | null>(null)
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null)
  const [renamingFileValue, setRenamingFileValue] = useState("")
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const current = SETTINGS_NAV.find((item) => item.id === section)
  const currentLabel = current ? t(current.labelKey) : ""
  const dialogVariants: Variants = {
    initial: { opacity: 0, scale: 0.95, y: 40 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 40 },
  }
  const dialogTransition: Transition = {
    type: "spring",
    bounce: 0,
    duration: 0.25,
  }

  const createFolder = (name: string) => {
    if (!name) return

    const id = `folder-${Date.now()}`
    setFolders((prev) => [...prev, { id, name, files: [] }])
    setExpandedFolders((prev) => new Set(prev).add(id))
    toast(`Folder created: ${name}`)
  }

  const addFileToFolder = (folderId: string, name: string) => {
    if (!name) return

    const ext = name.split(".").pop()?.toLowerCase() ?? "md"
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name,
      ext,
    }

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId ? { ...folder, files: [...folder.files, newFile] } : folder
      )
    )
    setExpandedFolders((prev) => new Set(prev).add(folderId))
    toast(`File added: ${name}`)
  }

  const openCreationDialog = (type: "folder" | "file", folderId?: string) => {
    setCreationMode(type)
    setCreationFolderId(folderId ?? null)
    setCreationValue(type === "folder" ? "New Folder" : "Untitled Draft.md")
  }

  const closeCreationDialog = () => {
    setCreationMode(null)
    setCreationFolderId(null)
    setCreationValue("")
  }

  const submitCreation = () => {
    const name = creationValue.trim()
    if (!name || !creationMode) return

    if (creationMode === "folder") createFolder(name)
    if (creationMode === "file" && creationFolderId) addFileToFolder(creationFolderId, name)

    closeCreationDialog()
  }

  const deleteFolder = (folderId: string) => {
    const folder = folders.find((item) => item.id === folderId)
    if (!folder) return

    const containsActiveFile = folder.files.some((file) => file.id === activeFileId)

    setFolders((prev) => prev.filter((item) => item.id !== folderId))
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      next.delete(folderId)
      return next
    })

    if (containsActiveFile) {
      setActiveFileId(null)
      setActiveFile(null)
    }

    toast(`Folder removed: ${folder.name}`)
  }

  const openRenameFileDialog = (fileId: string) => {
    const sourceFolder = folders.find((folder) => folder.files.some((file) => file.id === fileId))
    const file = sourceFolder?.files.find((item) => item.id === fileId)
    if (!sourceFolder || !file) return

    setRenamingFileId(fileId)
    setRenamingFileValue(file.name)
  }

  const closeRenameFileDialog = () => {
    setRenamingFileId(null)
    setRenamingFileValue("")
  }

  const submitRenameFile = () => {
    const fileId = renamingFileId
    const name = renamingFileValue.trim()
    if (!fileId || !name) return

    const sourceFolder = folders.find((folder) => folder.files.some((file) => file.id === fileId))
    const file = sourceFolder?.files.find((item) => item.id === fileId)
    if (!sourceFolder || !file || name === file.name) return

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === sourceFolder.id
          ? {
              ...folder,
              files: folder.files.map((item) =>
                item.id === fileId ? { ...item, name } : item
              ),
            }
          : folder
      )
    )

    if (activeFileId === fileId) {
      setActiveFile((prev) => (prev ? { ...prev, name } : prev))
    }

    toast("File renamed")
    closeRenameFileDialog()
  }

  const requestDeleteFile = (fileId: string) => {
    setDeletingFileId(fileId)
  }

  const confirmDeleteFile = () => {
    const fileId = deletingFileId
    if (!fileId) return

    setFolders((prev) =>
      prev
        .map((folder) => ({
          ...folder,
          files: folder.files.filter((file) => file.id !== fileId),
        }))
        .filter((folder) => folder.files.length > 0)
    )

    if (activeFileId === fileId) {
      setActiveFileId(null)
      setActiveFile(null)
    }

    toast("File removed")
    setDeletingFileId(null)
  }

  const sharedSidebarProps = {
    folders,
    expandedFolders,
    onToggleFolder: (id: string) =>
      setExpandedFolders((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }),
    activeFileId,
    onSelectFile: (file: FileItem) => {
      setActiveFileId(file.id)
      setActiveFile(file)
    },
    onCreateFolder: () => openCreationDialog("folder"),
    onAddFile: (folderId: string) => openCreationDialog("file", folderId),
    onRenameFolder: (folderId: string, name: string) =>
      setFolders((prev) =>
        prev.map((folder) => (folder.id === folderId ? { ...folder, name } : folder))
      ),
    onDeleteFolder: deleteFolder,
    onRenameFile: openRenameFileDialog,
    onOpenEditor: () => {},
    onDeleteFile: requestDeleteFile,
    onMoveFile: (fileId: string, targetFolderId?: string, targetIndex?: number) =>
      setFolders((prev) => {
        const sourceFolder = prev.find((folder) =>
          folder.files.some((file) => file.id === fileId)
        )
        const file = sourceFolder?.files.find((item) => item.id === fileId)
        if (!sourceFolder || !file || !targetFolderId) return prev

        return prev.map((folder) => {
          const remainingFiles = folder.files.filter((item) => item.id !== fileId)
          if (folder.id !== targetFolderId) return { ...folder, files: remainingFiles }
          const nextFiles = [...remainingFiles]
          const insertAt =
            typeof targetIndex === "number"
              ? Math.max(0, Math.min(targetIndex, nextFiles.length))
              : nextFiles.length
          nextFiles.splice(insertAt, 0, file)
          return { ...folder, files: nextFiles }
        })
      }),
  }

  return (
    <>
      <Dialog
        open={creationMode !== null}
        onOpenChange={(open) => !open && closeCreationDialog()}
        variants={dialogVariants}
        transition={dialogTransition}
      >
        <DialogContent className="w-full max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">
              {creationMode === "folder" ? "Create folder" : "Create file"}
            </DialogTitle>
            <DialogDescription className="text-zinc-600">
              {creationMode === "folder" ? "Enter folder name." : "Enter file name."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col space-y-4">
            <label htmlFor="settings-creation-name" className="sr-only">
              Name
            </label>
            <input
              id="settings-creation-name"
              value={creationValue}
              onChange={(event) => setCreationValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  submitCreation()
                }
              }}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 sm:text-sm"
              placeholder="Enter name"
              autoFocus
            />
            <button
              className="inline-flex items-center justify-center self-end rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50"
              type="button"
              onClick={submitCreation}
            >
              Create
            </button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      <Dialog
        open={renamingFileId !== null}
        onOpenChange={(open) => !open && closeRenameFileDialog()}
        variants={dialogVariants}
        transition={dialogTransition}
      >
        <DialogContent className="w-full max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Rename file</DialogTitle>
            <DialogDescription className="text-zinc-600">
              Update the file name shown in the workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col space-y-4">
            <label htmlFor="settings-rename-file-name" className="sr-only">
              Name
            </label>
            <input
              id="settings-rename-file-name"
              value={renamingFileValue}
              onChange={(event) => setRenamingFileValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  submitRenameFile()
                }
              }}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 sm:text-sm"
              placeholder="Enter file name"
              autoFocus
            />
            <button
              className="inline-flex items-center justify-center self-end rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50"
              type="button"
              onClick={submitRenameFile}
            >
              Rename
            </button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingFileId !== null}
        onOpenChange={(open) => !open && setDeletingFileId(null)}
        variants={dialogVariants}
        transition={dialogTransition}
      >
        <DialogContent className="w-full max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Delete file?</DialogTitle>
            <DialogDescription className="text-zinc-600">
              This removes the file from the workspace sidebar.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
              type="button"
              onClick={() => setDeletingFileId(null)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50"
              type="button"
              onClick={confirmDeleteFile}
            >
              Delete
            </button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      <WorkspaceSidebarShell
        leftSidebar={
          <ChatSidebar
            side="left"
            mode="consultant"
            activeFile={activeFile}
            {...sharedSidebarProps}
          />
        }
        rightSidebar={
          <ChatSidebar
            side="right"
            mode="consultant"
            activeFile={activeFile}
            {...sharedSidebarProps}
          />
        }
      >
        <div className="min-h-dvh bg-[#f4f5f7]">
          <header className="sticky top-0 z-30 bg-[#f4f5f7]/96 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
              <NavLink to="/assistant">
                <Button variant="ghost" size="sm" className="gap-2 text-[#374151]">
                  <ArrowLeft className="size-4" />
                  {t("settings.back")}
                </Button>
              </NavLink>
              <p className="text-sm font-medium text-[#111827]">{t("settings.title")}</p>
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl px-4 py-6">
            <div className="rounded-[1.5rem] border border-[#d6dce5] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
                <nav className="space-y-1 rounded-[1.15rem] bg-[#f8fafc] p-2">
                  {SETTINGS_NAV.map(({ id, labelKey, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSection(id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                        section === id
                          ? "bg-white text-[#111827] shadow-sm"
                          : "text-[#4b5563] hover:bg-white/70 hover:text-[#111827]"
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      {t(labelKey)}
                    </button>
                  ))}
                </nav>

                <main className="min-w-0 rounded-[1.15rem] bg-[#fbfcfd] p-4 sm:p-6">
                  <h1 className="mb-5 text-lg font-medium text-[#111827]">{currentLabel}</h1>

                  {section === "profile" && <ProfileSection />}
                  {section === "language" && <LanguageSection />}
                  {section === "appearance" && <PlaceholderSection label="Appearance" />}
                  {section === "notifications" && <PlaceholderSection label="Notifications" />}
                  {section === "security" && <PlaceholderSection label="Security" />}
                  {section === "billing" && <PlaceholderSection label="Billing" />}
                </main>
              </div>
            </div>
          </div>
        </div>
      </WorkspaceSidebarShell>
    </>
  )
}
