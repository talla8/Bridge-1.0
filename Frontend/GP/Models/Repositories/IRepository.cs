namespace GP.Models.Repositories
{
    public interface IRepository<T>
    {
        void Add(T entity);
        void Update(int Id, T entity);
        void Delete(int Id);
        void Active(int Id);
        List<T> ViewAdmin();
        List<T> ViewClient();
        T Find(int Id);
    }
}
