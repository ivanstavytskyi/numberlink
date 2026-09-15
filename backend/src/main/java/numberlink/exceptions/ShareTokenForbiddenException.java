package numberlink.exceptions;

import org.springframework.http.HttpStatus;

public class ShareTokenForbiddenException extends ApiException {
    public ShareTokenForbiddenException() {
        super(HttpStatus.FORBIDDEN, "SHARE_TOKEN_FORBIDDEN", "Share token generation forbidden");
    }
}
