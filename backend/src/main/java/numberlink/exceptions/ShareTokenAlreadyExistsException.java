package numberlink.exceptions;

import org.springframework.http.HttpStatus;

public class ShareTokenAlreadyExistsException extends ApiException {
    public ShareTokenAlreadyExistsException() {
        super(HttpStatus.CONFLICT, "SHARE_TOKEN_EXISTS", "Share token already exists");
    }
}
