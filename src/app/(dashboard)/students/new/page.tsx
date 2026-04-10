import { PageHeader } from "@/components/layout/PageHeader";
import { StudentForm } from "@/components/students/StudentForm";

export default function NewStudentPage() {
  return (
    <div>
      <PageHeader title="Add New Student" description="Fill in the student's details below" />
      <StudentForm />
    </div>
  );
}
