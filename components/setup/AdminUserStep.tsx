import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Mail, Lock } from 'lucide-react';
import { SetupData } from '@/type-definitions/SetupData';

interface AdminUserStepProps {
    onPasswordChange: (isOk: boolean) => void;
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const AdminUserStep: React.FC<AdminUserStepProps> = ({ data, updateData, onPasswordChange }) => {
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState({
        message: 'Mindestens 8 Zeichen, Groß- und Kleinbuchstaben sowie eine Zahl erforderlich.',
        className: 'text-gray-500'
    });

    const updateAdminUser = (field: string, value: string | boolean) => {
        updateData('adminUser', { [field]: value });
    };

    useEffect(() => {
        const password = data.adminUser.password;

        if (password.length === 0) {
            setPasswordError({
                message: 'Mindestens 8 Zeichen, Groß- und Kleinbuchstaben sowie eine Zahl erforderlich.',
                className: 'text-gray-500'
            })
            onPasswordChange(false)
            return
        }

        const isValid =
            password.length >= 8 &&
            /[a-z]/.test(password) &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password);

        if (!isValid) {
            setPasswordError({
                message: 'Das Passwort muss mindestens 8 Zeichen lang sein und Groß-, Kleinbuchstaben sowie eine Zahl enthalten.',
                className: 'text-red-600'
            })
            onPasswordChange(false)
        } else if (password !== confirmPassword) {
            setPasswordError({
                message: 'Passwörter stimmen nicht überein.',
                className: 'text-red-600'
            })
            onPasswordChange(false)
        } else if (isValid && (password === confirmPassword)) {
            setPasswordError({
                message: 'Perfekt! Ihr Passwort erfüllt alle Sicherheitsanforderungen. 🔒',
                className: 'text-lime-600'
            })
            onPasswordChange(true)
        }

    }, [data.adminUser.password, confirmPassword, onPasswordChange]);

    return (
        <div className={"space-y-6"}>
            <div className={"text-center"}>
                <div className={"w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"}>
                    <User className={"w-8 h-8 text-indigo-500"} />
                </div>
                <h2 className={"text-xl font-semibold mb-2"}>
                    Admin-Benutzer erstellen
                </h2>
                <p className={"text-gray-500 text-sm"}>
                    Erstellen Sie den ersten Administrator-Account für Ihr CortexUI Dashboard.
                </p>
            </div>

            <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
                <div className={"space-y-2"}>
                    <Label htmlFor={"firstName"}>
                        Vorname <span className={"text-red-500"}>*</span>
                    </Label>
                    <Input
                        id={"firstName"}
                        placeholder={"Cortex"}
                        value={data.adminUser.firstName}
                        onChange={(e) => updateAdminUser('firstName', e.target.value)}
                    />
                </div>

                <div className={"space-y-2"}>
                    <Label htmlFor={"lastName"}>
                        Nachname <span className={"text-red-500"}>*</span>
                    </Label>
                    <Input
                        id={"lastName"}
                        placeholder={"Admin"}
                        value={data.adminUser.lastName}
                        onChange={(e) => updateAdminUser('lastName', e.target.value)}
                    />
                </div>
            </div>

            <div className={"space-y-2"}>
                <Label htmlFor={"email"}>
                    E-Mail-Adresse <span className={"text-red-500"}>*</span>
                </Label>
                <div className={"relative"}>
                    <Mail className={"absolute left-3 top-3 w-4 h-4 text-gray-500"} />
                    <Input
                        id={"email"}
                        type={"email"}
                        placeholder={"admin@cortex.ui"}
                        className={"pl-10"}
                        value={data.adminUser.email}
                        onChange={(e) => updateAdminUser('email', e.target.value)}
                    />
                </div>
            </div>
            <div className={"space-y-2"}>
                <Label htmlFor={"password"}>
                    Passwort <span className={"text-red-500"}>*</span>
                </Label>
                <div className={"relative"}>
                    <Lock className={"absolute left-3 top-3 w-4 h-4 text-gray-500"} />
                    <Input
                        id={"password"}
                        type={"password"}
                        placeholder={"Passwort eingeben"}
                        className={"pl-10"}
                        value={data.adminUser.password}
                        onChange={(e) => updateAdminUser('password', e.target.value)}
                    />
                </div>
            </div>
            <div className={"space-y-2"}>
                <Label htmlFor={"password"}>
                    Passwort wiederholen <span className={"text-red-500"}>*</span>
                </Label>
                <div className={"relative"}>
                    <Lock className={"absolute left-3 top-3 w-4 h-4 text-gray-500"} />
                    <Input
                        id={"confirmPassword"}
                        type={"password"}
                        placeholder={"Passwort bestätigen"}
                        className={"pl-10 mt-2"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <p className={`text-xs ${passwordError.className}`}>
                    {passwordError.message}
                </p>
            </div>

            <div className={"flex items-center space-x-2 p-4 bg-slate-100 rounded-lg"}>
                <Checkbox
                    id={"emailVerification"}
                    checked={data.adminUser.emailVerification}
                    onCheckedChange={(checked) => updateAdminUser('emailVerification', checked)}
                />
                <Label htmlFor={"emailVerification"} className={"text-sm"}>
                    E-Mail-Verifizierung aktivieren
                </Label>
            </div>

            <div className={"bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"}>
                <p className={"text-sm text-blue-900"}>
                    <strong>Rolle:</strong> Dieser Benutzer erhält automatisch Administrator-Rechte und kann alle Funktionen von CortexUI nutzen.
                </p>
            </div>
        </div>
    );
};
