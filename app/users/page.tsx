'use client'

import {useEffect, useState} from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    User,
    ShieldAlert,
    KeyRound,
    X,
    Save
} from 'lucide-react';
import {useAuth} from "@/context/AuthContext";
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {UserPublic} from "@/types/User";

function capitalize(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

interface EditUser extends UserPublic {
    password?: string | null
}

const emptyUser = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'viewer',
    isActive: false,
    password: ''
}

const AdminUsers = () => {
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [todaysLogins, setTodaysLogins] = useState<number>(0)
    const [activeUsers, setActiveUsers] = useState<number>(0)
    const [administrators, setAdministrators] = useState<number>(0)
    const [users, setUsers] = useState<UserPublic[]>([])
    const [editingUser, setEditingUser] = useState<EditUser | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [reload, setReload] = useState<boolean>(true)
    const [newUser, setNewUser] = useState(emptyUser);

    useEffect(() => {
        if (reload) {
            setReload(false)
            fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/users`, {
                method: 'GET',
                headers: {
                    ContentType: 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                }
            })
                .then(res => res.json())
                .then(json => {
                    if (json.isOk) {
                        setUsers(json.data)
                        setTodaysLogins(json.todaysLogins)
                        setActiveUsers(json.activeUsers)
                        setAdministrators(json.administrators)
                    }
                })
        }
    }, [reload]);

    const filteredUsers = users.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    function handleEditUser() {
        fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/admin/users`, {
            method: 'PUT',
            headers: {
                ContentType: 'application/json',
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify(editingUser)
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setShowForm(false)
                    setReload(true)
                    setEditingUser(null)
                }
            })
    }
    function handleNewUser() {
        fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/admin/users`, {
            method: 'POST',
            headers: {
                ContentType: 'application/json',
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify(newUser)
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setShowForm(false)
                    setReload(true)
                    setNewUser(emptyUser)
                }
            })
    }

    return (
        <div className={"p-6 space-y-6"}>
            <div className={"flex items-center justify-between"}>
                <div>
                    <h1 className={"text-3xl font-bold text-slate-900"}>
                        Benutzerverwaltung
                    </h1>
                    <p className={"text-gray-500 mt-1"}>
                        Verwalten Sie Benutzerkonten und Berechtigungen
                    </p>
                </div>
                <button
                    className={"bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"}
                    onClick={() => {
                        setEditingUser(null)
                        setShowForm(true)
                    }}
                >
                    <Plus className={"h-4 w-4"} />
                    <span>
                        Neuer Benutzer
                    </span>
                </button>
            </div>

            <div className={"bg-slate-100 border border-slate-200 rounded-lg p-4"}>
                <div className={"flex items-center gap-4"}>
                    <div className={"relative flex-1"}>
                        <Search className={"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"} />
                        <input
                            type={"text"}
                            placeholder={"Benutzer suchen..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={"w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}
                        />
                    </div>
                </div>
            </div>

            <div className={"bg-slate-100 border border-slate-200 rounded-lg overflow-hidden"}>
                <div className={"overflow-x-auto"}>
                    <table className={"w-full"}>
                        <thead className={"bg-slate-100"}>
                        <tr>
                            <th className={"text-left p-4 text-gray-500 font-medium"}>
                                Benutzer
                            </th>
                            <th className={"text-left p-4 text-gray-500 font-medium"}>
                                Rolle
                            </th>
                            <th className={"text-left p-4 text-gray-500 font-medium"}>
                                Status
                            </th>
                            <th className={"text-left p-4 text-gray-500 font-medium"}>
                                Letzter Login
                            </th>
                            <th className={"text-left p-4 text-gray-500 font-medium"}>
                                Aktionen
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers.map((dbUser) => (
                            <tr key={dbUser.uid} className={"border-t border-slate-200 hover:bg-slate-100/50"}>
                                <td className={"p-4"}>
                                    <div className={"flex items-center gap-3"}>
                                        <div className={"bg-indigo-500/20 p-2 rounded-full"}>
                                            <User className={"h-4 w-4 text-indigo-400"} />
                                        </div>
                                        <div>
                                            <p className={"text-slate-900 font-medium"}>
                                                {dbUser.firstName} {dbUser.lastName}
                                            </p>
                                            <p className={"text-gray-400 text-sm"}>
                                                {dbUser.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className={"p-4"}>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        dbUser.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                            dbUser.role === 'editor' ? 'bg-yellow-500/20 text-yellow-400' :
                                                dbUser.role === 'writer' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {capitalize(dbUser.role)}
                                    </span>
                                </td>
                                <td className={"p-4"}>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        dbUser.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {dbUser.isActive ? 'aktiv' : 'inaktiv'}
                                    </span>
                                </td>
                                <td className={"p-4"}>
                                    <span className={"text-gray-500"}>
                                        {dbUser.lastSeen ? new Date(dbUser.lastSeen).toLocaleString() : '---'}
                                    </span>
                                </td>
                                <td className={"p-4"}>
                                    <div className={"flex items-center gap-2"}>
                                        <button
                                            className={"cursor-pointer bg-blue-500/20 text-blue-400 p-2 rounded-lg hover:bg-blue-500/30 transition-colors"}
                                            onClick={() => {
                                                setEditingUser(dbUser)
                                                setShowForm(true)
                                            }}
                                        >
                                            <Edit className={"h-4 w-4"} />
                                        </button>
                                        {dbUser.uid !== user?.uid && (
                                            <button
                                                className={"bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/30 transition-colors"}
                                                onClick={() => {
                                                    fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/admin/users`, {
                                                        method: 'DELETE',
                                                        headers: {
                                                            ContentType: 'application/json',
                                                            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                                                        },
                                                        body: JSON.stringify({uid: dbUser.uid}),
                                                    })
                                                        .then(res => {
                                                            if (res.status === 204) {
                                                                setReload(true)
                                                            }
                                                        })
                                                }}
                                            >
                                                <Trash2 className={"h-4 w-4"} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={"grid grid-cols-1 md:grid-cols-3 gap-6"}>
                <div className={"bg-slate-100 border border-slate-200  rounded-lg p-6"}>
                    <div className={"flex items-center gap-3"}>
                        <div className={"bg-green-500/40 p-3 rounded-lg"}>
                            <User className={"h-6 w-6 text-green-600"} />
                        </div>
                        <div>
                            <p className={"text-gray-500 text-sm"}>
                                Aktive Benutzer
                            </p>
                            <p className={"text-2xl font-bold text-slate-900"}>
                                {activeUsers}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={"bg-slate-100 border border-slate-200  rounded-lg p-6"}>
                    <div className={"flex items-center gap-3"}>
                        <div className={"bg-yellow-500/40 p-3 rounded-lg"}>
                            <ShieldAlert className={"h-6 w-6 text-yellow-600"} />
                        </div>
                        <div>
                            <p className={"text-gray-500 text-sm"}>
                                Administratoren
                            </p>
                            <p className={"text-2xl font-bold text-slate-900"}>
                                {administrators}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={"bg-slate-100 border border-slate-200  rounded-lg p-6"}>
                    <div className={"flex items-center gap-3"}>
                        <div className={"bg-blue-500/40 p-3 rounded-lg"}>
                            <KeyRound className={"h-6 w-6 text-blue-600"} />
                        </div>
                        <div>
                            <p className={"text-gray-500 text-sm"}>
                                Heutige Logins
                            </p>
                            <p className={"text-2xl font-bold text-slate-900"}>
                                {todaysLogins}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {showForm && (
                <div className={"fixed inset-0 bg-black/50 flex items-center justify-center z-50"}>
                    <div className={"bg-slate-100 border border-slate-200 rounded-lg p-6 w-full max-w-md"}>
                        <div className={"flex items-center justify-between mb-4"}>
                            <h2 className={"text-xl font-bold text-slate-900"}>
                                {editingUser ? `Benutzer ${editingUser.firstName} ${editingUser.lastName} bearbeiten` : 'Neuen Benutzer erstellen'}
                            </h2>
                            <Button
                                variant={"ghost"}
                                size={"sm"}
                                onClick={() => setShowForm(false)}
                                className={"text-gray-400 hover:text-white"}
                            >
                                <X className={"h-4 w-4"} />
                            </Button>
                        </div>

                        <div className={"space-y-4"}>
                            <div>
                                <Label htmlFor={"firstName"} className={"text-gray-500"}>
                                    Vorname
                                </Label>
                                <Input
                                    id={"firstName"}
                                    value={editingUser ? editingUser.firstName : newUser.firstName}
                                    onChange={(e) => editingUser ? setEditingUser({...editingUser, firstName: e.target.value }) : setNewUser({...newUser, firstName: e.target.value})}
                                    className={"bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}
                                    placeholder={"Vorname"}
                                />
                            </div>
                            <div>
                                <Label htmlFor={"lastName"} className={"text-gray-500"}>
                                    Nachname
                                </Label>
                                <Input
                                    id={"lastName"}
                                    value={editingUser ? editingUser.lastName : newUser.lastName}
                                    onChange={(e) => editingUser ? setEditingUser({...editingUser, lastName: e.target.value }) : setNewUser({...newUser, lastName: e.target.value})}
                                    className={"bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}
                                    placeholder={"Nachname"}
                                />
                            </div>

                            <div>
                                <Label htmlFor={"email"} className={"text-gray-500"}>
                                    Email
                                </Label>
                                <Input
                                    id={"email"}
                                    type={"email"}
                                    value={editingUser ? editingUser.email : newUser.email}
                                    onChange={(e) => editingUser ? setEditingUser({...editingUser, email: e.target.value }) : setNewUser({...newUser, email: e.target.value})}
                                    className={"bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}
                                    placeholder={"example@cortex.ui"}
                                />
                            </div>

                            <div>
                                <Label htmlFor={"password"} className={"text-gray-500"}>
                                    Passwort
                                </Label>
                                <Input
                                    id={"password"}
                                    type={"password"}
                                    value={editingUser ? editingUser.password as string : newUser.password}
                                    onChange={(e) => editingUser ? setEditingUser({...editingUser, password: e.target.value}) : setNewUser({...newUser, password: e.target.value})}
                                    className={"bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}
                                    placeholder={"Passwort"}
                                />
                            </div>

                            <div>
                                <Label htmlFor={"role"} className={"text-gray-500"}>
                                    Rolle
                                </Label>
                                <Select value={editingUser ? editingUser.role : newUser.role} onValueChange={(value) => editingUser ? setEditingUser({...editingUser, role: value}) : setNewUser({...newUser, role: value})}>
                                    <SelectTrigger className={"bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className={"bg-slate-100 border-slate-200 text-slate-900"}>
                                        <SelectItem value={"viewer"}>
                                            Viewer
                                        </SelectItem>
                                        <SelectItem value={"writer"}>
                                            Writer
                                        </SelectItem>
                                        <SelectItem value={"editor"}>
                                            Editor
                                        </SelectItem>
                                        <SelectItem value={"admin"}>
                                            Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor={"status"} className={"text-gray-500"}>
                                    Status
                                </Label>
                                <Select
                                    value={editingUser ? editingUser.isActive.toString() : newUser.isActive.toString()}
                                    onValueChange={(value) => editingUser ? setEditingUser({...editingUser, isActive: value === 'true'}) : setNewUser({...newUser, isActive: value === 'true'})}
                                >
                                    <SelectTrigger className={"bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className={"bg-slate-100 border-slate-200 text-slate-900"}>
                                        <SelectItem value={"true"}>
                                            Aktiv
                                        </SelectItem>
                                        <SelectItem value={"false"}>
                                            Inaktiv
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className={"flex gap-2 mt-6"}>
                            <Button
                                onClick={() => {
                                    if (editingUser) handleEditUser()
                                    else handleNewUser()
                                }}
                                className={"flex-1 bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"}
                                disabled={editingUser
                                    ? !editingUser.firstName || !editingUser.lastName || !editingUser.email
                                    : !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password}
                            >
                                <Save className={"h-4 w-4 mr-2"} />
                                <span>
                                    {editingUser ? 'Benutzer aktualisieren' : 'Benutzer erstellen'}
                                </span>
                            </Button>
                            <Button
                                variant={"outline"}
                                onClick={() => setShowForm(false)}
                                className={"border-slate-200 text-gray-500 hover:bg-slate-200 cursor-pointer"}
                            >
                                <span>
                                    Abbrechen
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;