import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Pencil, Plus, Stethoscope, Trash2, X } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Modal, { ConfirmModal } from '../../components/common/Modal'
import { Input, Textarea } from '../../components/forms/FormField'
import { getSpecialtyIcon } from '../../components/specialties/specialtyIcons'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States'
import { useApp, useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import specialtyService from '../../services/specialtyService'
import { getErrorMessage } from '../../utils/helpers'
import { rules } from '../../utils/validators'

export default function AdminSpecialties() {
  useDocumentTitle('Manage specialties')
  const { reloadSpecialties } = useApp()
  const toast = useToast()

  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(null) // null = closed, {} = create, {…} = edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [working, setWorking] = useState(false)
  const [conditions, setConditions] = useState([])
  const [conditionInput, setConditionInput] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await specialtyService.list()
      setSpecialties(data.specialties || [])
    } catch (err) {
      setError(getErrorMessage(err, 'Specialties could not be loaded.'))
      setSpecialties([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setConditions([])
    setConditionInput('')
    reset({ name: '', description: '', icon: '' })
    setEditing({})
  }

  const openEdit = (specialty) => {
    setConditions(specialty.conditions || [])
    setConditionInput('')
    reset({
      name: specialty.name || '',
      description: specialty.description || '',
      icon: specialty.icon || specialty.slug || '',
    })
    setEditing(specialty)
  }

  const addCondition = () => {
    const value = conditionInput.trim()
    if (!value) return
    if (conditions.includes(value)) {
      toast.warning('That condition is already listed.')
      return
    }
    setConditions((prev) => [...prev, value])
    setConditionInput('')
  }

  const onSubmit = async (values) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      icon: values.icon.trim(),
      conditions,
    }
    try {
      if (editing?._id) {
        await specialtyService.update(editing._id, payload)
        toast.success('Specialty updated.')
      } else {
        await specialtyService.create(payload)
        toast.success('Specialty created.')
      }
      setEditing(null)
      load()
      reloadSpecialties()
    } catch (err) {
      toast.error(getErrorMessage(err, 'The specialty could not be saved.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setWorking(true)
    try {
      await specialtyService.remove(deleteTarget._id)
      toast.success('Specialty deleted.')
      setDeleteTarget(null)
      load()
      reloadSpecialties()
    } catch (err) {
      toast.error(getErrorMessage(err, 'This specialty could not be deleted.'))
    } finally {
      setWorking(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Specialties"
        description="Manage the areas of care patients can browse and book within."
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add specialty
          </button>
        }
      />

      {loading && (
        <div className="table-wrap">
          <TableSkeleton rows={6} cols={4} />
        </div>
      )}

      {!loading && error && <ErrorState title="Could not load specialties" message={error} onRetry={load} />}

      {!loading && !error && specialties.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="No specialties yet"
          message="Add your first specialty so patients can start browsing."
          action={
            <button type="button" onClick={openCreate} className="btn-primary btn-sm">
              Add specialty
            </button>
          }
        />
      )}

      {!loading && !error && specialties.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Specialty</th>
                <th scope="col">Slug</th>
                <th scope="col">Conditions</th>
                <th scope="col">Doctors</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {specialties.map((s) => {
                const Icon = getSpecialtyIcon(s.icon || s.slug)
                return (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-ink-900">{s.name}</span>
                          <span className="block max-w-xs truncate text-xs text-ink-500">
                            {s.description}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">
                        {s.slug}
                      </code>
                    </td>
                    <td className="whitespace-nowrap">{s.conditions?.length ?? 0}</td>
                    <td className="whitespace-nowrap">{s.doctorCount ?? 0}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="btn-outline btn-sm"
                          aria-label={`Edit ${s.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Create / edit modal ---------- */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?._id ? 'Edit specialty' : 'Add specialty'}
        description="Specialties group doctors and help patients find the right care."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Name"
            required
            placeholder="e.g. Heart Health"
            error={errors.name?.message}
            {...register('name', rules.required('Name'))}
          />

          <Input
            label="Icon key"
            placeholder="e.g. heart-health"
            hint="Matches an icon in the ClinicCare icon set. Defaults to the generated slug."
            {...register('icon')}
          />

          <Textarea
            label="Description"
            required
            rows={3}
            placeholder="Describe what this specialty covers…"
            error={errors.description?.message}
            {...register('description', rules.required('Description'))}
          />

          <div>
            <span className="label">Common conditions</span>
            <div className="flex gap-2">
              <label htmlFor="condition-input" className="sr-only">
                Add a condition
              </label>
              <input
                id="condition-input"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCondition()
                  }
                }}
                placeholder="e.g. High blood pressure"
                className="input h-10 flex-1"
              />
              <button type="button" onClick={addCondition} className="btn-outline h-10">
                Add
              </button>
            </div>

            {conditions.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <li
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-sm text-ink-700"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setConditions((prev) => prev.filter((x) => x !== c))}
                      aria-label={`Remove ${c}`}
                      className="rounded-full p-0.5 text-ink-400 transition hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setEditing(null)} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving…' : editing?._id ? 'Save changes' : 'Create specialty'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={working}
        title="Delete this specialty?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed. Specialties that still have doctors assigned cannot be deleted.`
            : ''
        }
        confirmLabel="Delete specialty"
      />
    </>
  )
}
