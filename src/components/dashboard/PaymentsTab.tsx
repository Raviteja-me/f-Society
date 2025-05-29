import { PaymentRequest } from './types';

interface PaymentsTabProps {
  paymentRequests: PaymentRequest[];
}

export function PaymentsTab({ paymentRequests }: PaymentsTabProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Payment History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 dark:text-white">Student</th>
              <th className="text-left py-2 dark:text-white">Plan</th>
              <th className="text-left py-2 dark:text-white">Amount</th>
              <th className="text-left py-2 dark:text-white">Status</th>
              <th className="text-left py-2 dark:text-white">Created</th>
              <th className="text-left py-2 dark:text-white">Verified</th>
            </tr>
          </thead>
          <tbody>
            {paymentRequests.map(payment => (
              <tr key={payment.id} className="border-b dark:border-gray-700">
                <td className="py-2 dark:text-white">{payment.studentEmail}</td>
                <td className="py-2 dark:text-white">{payment.planName}</td>
                <td className="py-2 dark:text-white">₹{payment.amount.toFixed(2)}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    payment.status === 'success' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="py-2 dark:text-white">{payment.createdAt.toLocaleDateString()}</td>
                <td className="py-2 dark:text-white">
                  {payment.verifiedAt ? payment.verifiedAt.toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 