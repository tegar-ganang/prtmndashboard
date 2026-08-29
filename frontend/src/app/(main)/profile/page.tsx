import { Metadata } from "next";
import ProfileContainer from "./_containers/ProfileContainer";

export const metadata: Metadata = {
	title: "Profil Saya",
	description: "Kelola informasi akun dan password Anda",
};

export default function ProfilePage() {
	return <ProfileContainer />;
}
