export function StatusBadge({ status }: { status: string }) {
  const styles = {
    bought: 'bg-gray-200 text-black',
    in_inventory: 'bg-black text-white',
    sold: 'bg-black text-white',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {status === 'in_inventory' ? 'In Inventory' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
